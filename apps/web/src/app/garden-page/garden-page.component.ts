import { AsyncPipe, DatePipe, NgFor, NgIf } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Observable } from "rxjs";
import { Garden } from "@garden/shared";
import { GardenService } from "../garden.service";

@Component({
  selector: "app-garden-page",
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, RouterLink],
  template: `
    <main class="page-shell" *ngIf="garden$ | async as garden">
      <section class="hero-panel">
        <div>
          <p class="eyebrow">{{ garden.location }}</p>
          <h1>{{ garden.name }}</h1>
          <p>{{ garden.climateNotes }}</p>
        </div>
        <div class="garden-stats" aria-label="Garden stats">
          <strong>{{ garden.plants.length }}</strong>
          <span>tracked plants</span>
        </div>
      </section>

      <section class="section-heading">
        <div>
          <p class="eyebrow">MVP Journey 1</p>
          <h2>View Garden</h2>
        </div>
        <p>Real plant cards give the future Copilot stable context to reason over.</p>
      </section>

      <section class="plant-grid" aria-label="Plants">
        <article class="plant-card" *ngFor="let plant of garden.plants">
          <div>
            <p class="plant-type">{{ plant.species }}</p>
            <h3>{{ plant.nickname }}</h3>
            <p class="muted" *ngIf="plant.cultivar">{{ plant.cultivar }}</p>
          </div>

          <dl>
            <div>
              <dt>Location</dt>
              <dd>{{ plant.location }}</dd>
            </div>
            <div>
              <dt>Pot</dt>
              <dd>{{ plant.potSize }}</dd>
            </div>
            <div>
              <dt>Sun</dt>
              <dd>{{ plant.sunExposure }}</dd>
            </div>
          </dl>

          <div class="latest" *ngIf="plant.observations[0] as latest">
            <span>{{ latest.observedAt | date: "MMM d" }}</span>
            <p>{{ latest.summary }}</p>
          </div>

          <a class="button" [routerLink]="['/plants', plant.id]">Open profile</a>
        </article>
      </section>
    </main>
  `
})
export class GardenPageComponent {
  private readonly gardenService = inject(GardenService);
  readonly garden$: Observable<Garden> = this.gardenService.getGarden();
}
