import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  CreateObservationInput,
  Garden,
  Observation,
  Plant,
  PlantCareRecommendation,
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
}
