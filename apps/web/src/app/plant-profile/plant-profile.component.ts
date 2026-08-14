import { DatePipe } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  ApprovalRequest,
  CopilotStreamEvent,
  CreateObservationInput,
  ObservationType,
  Plant,
  PlantCareRecommendation
} from "@garden/shared";
import { Subscription } from "rxjs";
import { GardenService } from "../garden.service";

@Component({
  selector: "app-plant-profile",
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    @if (plant(); as plant) {
      <main class="page-shell detail-shell">
        <a class="back-link" routerLink="/">Back to garden</a>

        <section class="profile-header">
          <div>
            <p class="eyebrow">MVP Journey 2</p>
            <h1>{{ plant.nickname }}</h1>
            <p>
              {{ plant.species }}
              @if (plant.cultivar) {
                <span> · {{ plant.cultivar }}</span>
              }
            </p>
          </div>
          <div class="profile-note">{{ plant.notes }}</div>
        </section>

        <section class="profile-grid">
          <article class="info-panel">
            <h2>Plant Context</h2>
            <dl>
              <div>
                <dt>Location</dt>
                <dd>{{ plant.location }}</dd>
              </div>
              <div>
                <dt>Pot size</dt>
                <dd>{{ plant.potSize }}</dd>
              </div>
              <div>
                <dt>Sun exposure</dt>
                <dd>{{ plant.sunExposure }}</dd>
              </div>
            </dl>
          </article>

          <article class="info-panel copilot-placeholder">
            <p class="eyebrow">MVP Journey 3</p>
            <h2>Ask Copilot</h2>
            <form [formGroup]="questionForm" (ngSubmit)="askCopilot()">
              <label>
                Plant question
                <textarea
                  formControlName="question"
                  rows="4"
                  placeholder="Should I water Minerva today?"
                ></textarea>
              </label>

              <button class="button primary" type="submit" [disabled]="questionForm.invalid || isAskingCopilot()">
                @if (isAskingCopilot()) {
                  Preparing recommendation
                } @else {
                  Ask Copilot
                }
              </button>
            </form>

            @if (copilotError()) {
              <p class="error-text">{{ copilotError() }}</p>
            }

            @if (conversationId()) {
              <p class="context-note">Conversation: {{ conversationId() }}</p>
            }
          </article>
        </section>

        @if (copilotEvents().length) {
          <section class="agent-trace" aria-label="Copilot tool trace">
            <div class="section-heading compact">
              <h2>Copilot Workflow</h2>
              <p>Tool calls, retrieved context, streamed events, and controlled actions.</p>
            </div>
            <ol class="trace-list">
              @for (event of copilotEvents(); track event.id) {
                <li>
                  <span>{{ event.kind }}</span>
                  <strong>{{ event.title }}</strong>
                  <p>{{ event.detail }}</p>
                </li>
              }
            </ol>
          </section>
        }

        @if (recommendation(); as recommendation) {
          <section class="recommendation-panel" aria-label="Copilot recommendation">
            <div class="recommendation-header">
              <div>
                <p class="eyebrow">Structured Recommendation</p>
                <h2>{{ recommendation.summary }}</h2>
              </div>
              <div class="recommendation-meta">
                <span>{{ recommendation.urgency }} urgency</span>
                <span>{{ recommendation.confidence }} confidence</span>
                <span>{{ recommendationSourceLabel(recommendation.generatedBy) }}</span>
              </div>
            </div>

            <div class="recommendation-grid">
              <article>
                <h3>Recommended Actions</h3>
                <ol class="action-list">
                  @for (action of recommendation.recommendedActions; track action.label) {
                    <li>
                      <strong>{{ action.label }}</strong>
                      <p>{{ action.rationale }}</p>
                      <small>{{ action.timing }}</small>
                      @if (action.requiresApproval) {
                        <span class="approval-pill">approval needed</span>
                      }
                    </li>
                  }
                </ol>
              </article>

              <article>
                <h3>Missing Information</h3>
                <ul class="compact-list">
                  @for (item of recommendation.missingInformation; track item) {
                    <li>{{ item }}</li>
                  } @empty {
                    <li>No missing information flagged.</li>
                  }
                </ul>

                <h3>Care Notes</h3>
                <ul class="compact-list">
                  @for (note of recommendation.careNotes; track note) {
                    <li>{{ note }}</li>
                  }
                </ul>

                <p class="context-note">
                  Used {{ recommendation.contextUsed.observationsReviewed }} observations.
                  Retrieved {{ recommendation.contextUsed.knowledgeSourcesReviewed }} knowledge sources.
                  @if (recommendation.contextUsed.latestObservationDate) {
                    Latest: {{ recommendation.contextUsed.latestObservationDate | date: "MMM d, y" }}.
                  }
                </p>

                @if (recommendation.contextUsed.weather; as weather) {
                  <h3>Weather</h3>
                  <div class="context-box">
                    <strong>{{ weather.location }}</strong>
                    <p>{{ weather.summary }}</p>
                    <small>{{ weather.source }}</small>
                  </div>
                }

                @if (recommendation.contextUsed.safetyChecks.length) {
                  <h3>Guardrails</h3>
                  <ul class="compact-list">
                    @for (check of recommendation.contextUsed.safetyChecks; track check.id) {
                      <li>
                        <strong>{{ check.severity }}</strong>
                        {{ check.message }}
                      </li>
                    }
                  </ul>
                }

                @if (recommendation.contextUsed.sources.length) {
                  <h3>Sources</h3>
                  <ol class="source-list">
                    @for (source of recommendation.contextUsed.sources; track source.sourceId) {
                      <li>
                        <strong>{{ source.title }}</strong>
                        <p>{{ source.excerpt }}</p>
                        <small>Score {{ source.relevanceScore }}</small>
                      </li>
                    }
                  </ol>
                }
              </article>
            </div>
          </section>
        }

        @if (pendingApprovals().length) {
          <section class="approval-panel" aria-label="Pending approvals">
            <div class="section-heading compact">
              <h2>Approval Queue</h2>
              <p>Copilot cannot write to garden history without a human decision.</p>
            </div>

            <div class="approval-grid">
              @for (approval of pendingApprovals(); track approval.id) {
                <article class="approval-card">
                  <p class="eyebrow">Human-in-the-loop</p>
                  <h3>{{ approval.label }}</h3>
                  <p>{{ approval.description }}</p>
                  <dl>
                    <div>
                      <dt>Type</dt>
                      <dd>{{ approval.input.type }}</dd>
                    </div>
                    <div>
                      <dt>Summary</dt>
                      <dd>{{ approval.input.summary }}</dd>
                    </div>
                  </dl>
                  <div class="approval-actions">
                    <button class="button primary" type="button" (click)="approveObservation(approval)">
                      Approve
                    </button>
                    <button class="button" type="button" (click)="rejectObservation(approval)">
                      Reject
                    </button>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        <section class="observations-layout">
          <article class="info-panel">
            <h2>Add Observation</h2>
            <form [formGroup]="observationForm" (ngSubmit)="saveObservation()">
              <label>
                Type
                <select formControlName="type">
                  @for (type of observationTypes; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>

              <label>
                Summary
                <input formControlName="summary" placeholder="Watered deeply after dry top soil" />
              </label>

              <label>
                Details
                <textarea formControlName="details" rows="4" placeholder="Optional notes for future Copilot context"></textarea>
              </label>

              <button class="button primary" type="submit" [disabled]="observationForm.invalid">
                Save observation
              </button>
            </form>
          </article>

          <article class="info-panel">
            <h2>Observation History</h2>
            <ol class="timeline">
              @for (observation of plant.observations; track observation.id) {
                <li>
                  <time>{{ observation.observedAt | date: "MMM d, y" }}</time>
                  <strong>{{ observation.type }}</strong>
                  <p>{{ observation.summary }}</p>
                  @if (observation.details) {
                    <small>{{ observation.details }}</small>
                  }
                </li>
              }
            </ol>
          </article>
        </section>
      </main>
    }
  `
})
export class PlantProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly gardenService = inject(GardenService);
  private readonly formBuilder = inject(FormBuilder);

  readonly observationTypes: ObservationType[] = [
    "watering",
    "feeding",
    "pruning",
    "health-check",
    "repotting",
    "note"
  ];

  readonly plant = signal<Plant | null>(null);

  readonly observationForm = this.formBuilder.nonNullable.group({
    type: ["health-check" as ObservationType, Validators.required],
    summary: ["", [Validators.required, Validators.minLength(6)]],
    details: [""]
  });

  readonly questionForm = this.formBuilder.nonNullable.group({
    question: ["Should I water this plant today?", [Validators.required, Validators.minLength(8)]]
  });

  readonly recommendation = signal<PlantCareRecommendation | null>(null);
  readonly conversationId = signal("");
  readonly copilotEvents = signal<CopilotTraceItem[]>([]);
  readonly pendingApprovals = signal<ApprovalRequest[]>([]);
  readonly isAskingCopilot = signal(false);
  readonly copilotError = signal("");
  private streamSubscription?: Subscription;

  ngOnInit(): void {
    this.loadPlant();
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
  }

  recommendationSourceLabel(source: PlantCareRecommendation["generatedBy"]): string {
    if (source === "workers-ai") {
      return "Workers AI";
    }

    if (source === "openai") {
      return "OpenAI";
    }

    return "Local fallback";
  }

  saveObservation(): void {
    const currentPlant = this.plant();

    if (!currentPlant || this.observationForm.invalid) {
      return;
    }

    const input: CreateObservationInput = this.observationForm.getRawValue();

    this.gardenService.addObservation(currentPlant.id, input).subscribe((observation) => {
      this.plant.set({
        ...currentPlant,
        observations: [observation, ...currentPlant.observations]
      });
      this.observationForm.reset({ type: "health-check", summary: "", details: "" });
    });
  }

  askCopilot(): void {
    const currentPlant = this.plant();

    if (!currentPlant || this.questionForm.invalid || this.isAskingCopilot()) {
      return;
    }

    this.isAskingCopilot.set(true);
    this.copilotError.set("");
    this.recommendation.set(null);
    this.pendingApprovals.set([]);
    this.copilotEvents.set([]);
    this.streamSubscription?.unsubscribe();

    this.streamSubscription = this.gardenService
      .streamPlantQuestion(currentPlant.id, {
        ...this.questionForm.getRawValue(),
        conversationId: this.conversationId() || undefined
      })
      .subscribe({
        next: (event) => this.handleCopilotEvent(event),
        error: () => {
          this.copilotError.set("Copilot stream stopped unexpectedly. Check the API server and try again.");
          this.isAskingCopilot.set(false);
        },
        complete: () => {
          this.isAskingCopilot.set(false);
        }
      });
  }

  approveObservation(approval: ApprovalRequest): void {
    this.gardenService.approveObservation(approval.id).subscribe({
      next: (result) => {
        this.pendingApprovals.update((approvals) => approvals.filter((item) => item.id !== approval.id));

        if (result.observation) {
          const currentPlant = this.plant();

          if (currentPlant) {
            this.plant.set({
              ...currentPlant,
              observations: [result.observation, ...currentPlant.observations]
            });
          }

          this.addTraceItem("approval", "Observation saved", result.observation.summary);
        }
      },
      error: () => {
        this.copilotError.set("Approval could not be applied. The request may have expired; ask Copilot again.");
        this.addTraceItem("error", "Approval failed", approval.label);
      }
    });
  }

  rejectObservation(approval: ApprovalRequest): void {
    this.gardenService.rejectObservation(approval.id).subscribe({
      next: () => {
        this.pendingApprovals.update((approvals) => approvals.filter((item) => item.id !== approval.id));
        this.addTraceItem("approval", "Approval rejected", approval.label);
      },
      error: () => {
        this.copilotError.set("Approval could not be rejected. The request may have expired; ask Copilot again.");
        this.addTraceItem("error", "Approval rejection failed", approval.label);
      }
    });
  }

  private loadPlant(): void {
    const plantId = this.route.snapshot.paramMap.get("plantId");

    if (!plantId) {
      return;
    }

    this.gardenService.getPlant(plantId).subscribe((plant) => {
      this.plant.set(plant);
    });
  }

  private handleCopilotEvent(event: CopilotStreamEvent): void {
    if (event.type === "conversation-started") {
      this.conversationId.set(event.conversationId);
      this.addTraceItem("state", "Conversation started", event.conversationId);
      return;
    }

    if (event.type === "tool-call") {
      const kind =
        event.toolCall.name === "retrieveKnowledge"
          ? "knowledge"
          : event.toolCall.name === "getWeather"
            ? "weather"
            : event.toolCall.name === "runSafetyCheck"
              ? "safety"
              : "tool";
      this.addTraceItem(kind, `Calling ${event.toolCall.name}`, JSON.stringify(event.toolCall.input));
      return;
    }

    if (event.type === "tool-result") {
      this.addTraceItem("result", "Tool result", event.result.summary);
      return;
    }

    if (event.type === "recommendation") {
      this.recommendation.set(event.recommendation);
      this.addTraceItem("ai", "Structured recommendation ready", this.recommendationSourceLabel(event.recommendation.generatedBy));
      return;
    }

    if (event.type === "approval-request") {
      this.pendingApprovals.update((approvals) => [...approvals, event.approval]);
      this.addTraceItem("approval", "Approval requested", event.approval.label);
      return;
    }

    if (event.type === "error") {
      this.copilotError.set(event.message);
      this.addTraceItem("error", "Stream error", event.message);
      return;
    }

    this.addTraceItem("state", "Workflow complete", event.conversationId);
  }

  private addTraceItem(kind: CopilotTraceItem["kind"], title: string, detail: string): void {
    this.copilotEvents.update((events) => [
      ...events,
      {
        id: `${kind}-${crypto.randomUUID()}`,
        kind,
        title,
        detail
      }
    ]);
  }
}

interface CopilotTraceItem {
  id: string;
  kind: "state" | "tool" | "knowledge" | "weather" | "safety" | "result" | "ai" | "approval" | "error";
  title: string;
  detail: string;
}
