import { Component, inject, signal } from '@angular/core';
import { EventCard } from './event-card';
import { SearchBar } from './search-bar';
import { EventsService } from '../../core/events.service';

@Component({
  selector: 'app-event-list',
  imports: [EventCard, SearchBar],
  template: `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
      <app-search-bar [(query)]="searchQuery" />
      <p class="text-gray-500 mt-2">Searching for: {{ searchQuery() }}</p>
    </div>

    <!-- TODO Mod 2: Wrap in @if (events.isLoading()) -->
    @if (events.error()) {
      <div class="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
        Failed to load events. Is the server running?
      </div>
    }

    @if (events.isLoading()) {
      <div class="text-center py-12 text-gray-500 animate-pulse">Loading events...</div>
    }

    @if (events.hasValue()) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- TODO Mod 2: Use @for to iterate over resource -->
        @for (event of events.value(); track event.id) {
          <app-event-card
            [id]="event.id"
            [title]="event.title"
            [date]="event.date"
            [trackingId]="'event_card_' + event.id"
            [image]="event.image"
            (delete)="deleteEvent(event.id)"
          />
        } @empty {
          <p class="col-span-3 text-center text-gray-500">No events found.</p>
        }
      </div>
    }
  `,
})
export class EventList {
  readonly eventsService = inject(EventsService);

  readonly console = console;
  searchQuery = signal('');

  readonly events = this.eventsService.getEventsResource(this.searchQuery);

  deleteEvent(id: string) {
    if (!confirm('Are you sure?')) return;

    this.eventsService.deleteEvent(id).subscribe({
      next: () => {
        this.events.reload();
      },
      error: (err) => {
        this.console.log('Delete failed', err);
        alert('Could not delete event');
      },
    });
  }
}
