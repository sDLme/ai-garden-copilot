import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  ApprovalDecisionResponse,
  CopilotStreamEvent,
  CreateObservationInput,
  Garden,
  Observation,
  Plant,
  PlantCareRecommendation,
  PlantPhotoAnalysis,
  PlantPhotoAnalysisRequest,
  PlantQuestionRequest
} from "@garden/shared";
import { getApiBaseUrl } from "./app-config";

@Injectable({ providedIn: "root" })
export class GardenService {
  private readonly apiBase = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  getGarden(): Observable<Garden> {
    return this.http.get<Garden>(`${this.apiBase}/garden`);
  }

  getPlant(plantId: string): Observable<Plant> {
    return this.http.get<Plant>(`${this.apiBase}/plants/${plantId}`);
  }

  addObservation(plantId: string, input: CreateObservationInput): Observable<Observation> {
    return this.http.post<Observation>(`${this.apiBase}/plants/${plantId}/observations`, input);
  }

  askPlantQuestion(plantId: string, input: PlantQuestionRequest): Observable<PlantCareRecommendation> {
    return this.http.post<PlantCareRecommendation>(`${this.apiBase}/plants/${plantId}/recommendations`, input);
  }

  analyzePlantPhoto(plantId: string, input: PlantPhotoAnalysisRequest): Observable<PlantPhotoAnalysis> {
    return this.http.post<PlantPhotoAnalysis>(`${this.apiBase}/plants/${plantId}/photo-analysis`, input);
  }

  streamPlantQuestion(plantId: string, input: PlantQuestionRequest): Observable<CopilotStreamEvent> {
    return new Observable<CopilotStreamEvent>((subscriber) => {
      const controller = new AbortController();

      void this.readCopilotStream(plantId, input, controller, (event) => subscriber.next(event))
        .then(() => subscriber.complete())
        .catch((error) => subscriber.error(error));

      return () => controller.abort();
    });
  }

  approveObservation(approvalId: string): Observable<ApprovalDecisionResponse> {
    return this.http.post<ApprovalDecisionResponse>(`${this.apiBase}/approvals/${approvalId}/approve`, {});
  }

  rejectObservation(approvalId: string): Observable<ApprovalDecisionResponse> {
    return this.http.post<ApprovalDecisionResponse>(`${this.apiBase}/approvals/${approvalId}/reject`, {});
  }

  private async readCopilotStream(
    plantId: string,
    input: PlantQuestionRequest,
    controller: AbortController,
    onEvent: (event: CopilotStreamEvent) => void
  ): Promise<void> {
    const response = await fetch(`${this.apiBase}/plants/${plantId}/recommendations/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      throw new Error(`Copilot stream failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const event = parseSseChunk(chunk);

        if (event) {
          onEvent(event);
        }
      }
    }
  }
}

function parseSseChunk(chunk: string): CopilotStreamEvent | undefined {
  const dataLine = chunk
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    return undefined;
  }

  return JSON.parse(dataLine.slice("data: ".length)) as CopilotStreamEvent;
}
