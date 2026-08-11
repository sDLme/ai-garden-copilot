import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="shell-header">
      <a class="brand" routerLink="/">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>
          <strong>AI Garden Copilot</strong>
          <small>Phase 1 MVP</small>
        </span>
      </a>
    </header>

    <router-outlet />
  `
})
export class AppComponent {}
