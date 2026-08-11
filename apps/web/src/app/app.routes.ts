import { Routes } from "@angular/router";
import { GardenPageComponent } from "./garden-page/garden-page.component";
import { PlantProfileComponent } from "./plant-profile/plant-profile.component";

export const routes: Routes = [
  { path: "", component: GardenPageComponent },
  { path: "plants/:plantId", component: PlantProfileComponent },
  { path: "**", redirectTo: "" }
];
