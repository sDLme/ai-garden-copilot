import { DatePipe, NgFor, NgIf } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CreateObservationInput, ObservationType, Plant } from "@garden/shared";
import { GardenService } from "../garden.service";

@Component({
  selector: "app-plant-profile",
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell detail-shell" *ngIf="plant">
      <a class="back-link" routerLink="/">Back to garden</a>

      <section class="profile-header">
        <div>
          <p class="eyebrow">MVP Journey 2</p>
          <h1>{{ plant.nickname }}</h1>
          <p>{{ plant.species }}<span *ngIf="plant.cultivar"> · {{ plant.cultivar }}</span></p>
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
          <p>
            Phase 1 keeps this non-AI. In Phase 2, this panel will send plant context
            to the LLM and return structured care recommendations.
          </p>
        </article>
      </section>

      <section class="observations-layout">
        <article class="info-panel">
          <h2>Add Observation</h2>
          <form [formGroup]="observationForm" (ngSubmit)="saveObservation()">
            <label>
              Type
              <select formControlName="type">
                <option *ngFor="let type of observationTypes" [value]="type">{{ type }}</option>
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
            <li *ngFor="let observation of plant.observations">
              <time>{{ observation.observedAt | date: "MMM d, y" }}</time>
              <strong>{{ observation.type }}</strong>
              <p>{{ observation.summary }}</p>
              <small *ngIf="observation.details">{{ observation.details }}</small>
            </li>
          </ol>
        </article>
      </section>
    </main>
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

  plant: Plant | null = null;

  readonly observationForm = this.formBuilder.nonNullable.group({
    type: ["health-check" as ObservationType, Validators.required],
    summary: ["", [Validators.required, Validators.minLength(6)]],
    details: [""]
  });

  ngOnInit(): void {
    this.loadPlant();
  }

  saveObservation(): void {
    const currentPlant = this.plant;

    if (!currentPlant || this.observationForm.invalid) {
      return;
    }

    const input: CreateObservationInput = this.observationForm.getRawValue();

    this.gardenService.addObservation(currentPlant.id, input).subscribe((observation) => {
      this.plant = {
        ...currentPlant,
        observations: [observation, ...currentPlant.observations]
      };
      this.observationForm.reset({ type: "health-check", summary: "", details: "" });
    });
  }

  private loadPlant(): void {
    const plantId = this.route.snapshot.paramMap.get("plantId");

    if (!plantId) {
      return;
    }

    this.gardenService.getPlant(plantId).subscribe((plant) => {
      this.plant = plant;
    });
  }
}
