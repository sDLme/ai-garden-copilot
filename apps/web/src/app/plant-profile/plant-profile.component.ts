import { DatePipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CreateObservationInput, ObservationType, Plant, PlantCareRecommendation } from "@garden/shared";
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
          </article>
        </section>

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
                <span>{{ recommendation.generatedBy === "openai" ? "OpenAI" : "Local fallback" }}</span>
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
                  @if (recommendation.contextUsed.latestObservationDate) {
                    Latest: {{ recommendation.contextUsed.latestObservationDate | date: "MMM d, y" }}.
                  }
                </p>
              </article>
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
export class PlantProfileComponent implements OnInit {
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
  readonly isAskingCopilot = signal(false);
  readonly copilotError = signal("");

  ngOnInit(): void {
    this.loadPlant();
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

    this.gardenService
      .askPlantQuestion(currentPlant.id, this.questionForm.getRawValue())
      .subscribe({
        next: (recommendation) => {
          this.recommendation.set(recommendation);
          this.isAskingCopilot.set(false);
        },
        error: () => {
          this.copilotError.set("Copilot could not prepare a recommendation. Check the API server and try again.");
          this.isAskingCopilot.set(false);
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
}
