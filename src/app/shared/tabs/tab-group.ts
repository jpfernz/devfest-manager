import { Component, contentChildren, effect, inject } from '@angular/core';
import { TabState } from './tab-state';
import { Tab } from './tabs';

@Component({
  selector: 'app-tab-group',
  // SERVICE SANDBOX:
  // Every time <app-tab-group> is used, a NEW instance of TabState is created.
  providers: [TabState],
  template: `
    <div class="border-b border-gray-200 flex gap-4">
      <!-- Render the buttons -->
      @for (tab of tabs(); track tab.label()) {
        <button
          (click)="activate(tab.label())"
          class="px-4 py-2 border-b-2 transition-colors font-medium"
          [class.border-blue-600]="state.activeTab() === tab.label()"
          [class.text-blue-600]="state.activeTab() === tab.label()"
          [class.border-transparent]="state.activeTab() !== tab.label()"
        >
          {{ tab.label() }}
        </button>
      }
    </div>

    <!-- Render the active content -->
    <ng-content />
  `,
})
export class TabGroup {
  readonly state = inject(TabState);

  readonly tabs = contentChildren(Tab);

  constructor() {
    // Select the first tab autoamtically when tabs load
    effect(() => {
      const allTabs = this.tabs();
      if (allTabs.length > 0 && !this.state.activeTab()) {
        this.state.activate(allTabs[0].label());
      }
    });
  }

  activate(label: string) {
    this.state.activate(label);
  }
}
