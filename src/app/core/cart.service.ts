import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { TICKETS_URL } from './tokens';

interface TicketEntry {
  id: string;
  eventId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly ticketsUrl = inject(TICKETS_URL);
  private readonly ticketIds = signal<string[]>([]); // holds the state
  readonly count = computed(() => this.ticketIds().length);

  constructor() {
    this.loadTickets();
  }

  private loadTickets() {
    this.http.get<TicketEntry[]>(this.ticketsUrl).subscribe({
      next: (data) => {
        const ids = data.map((t) => t.eventId);
        this.ticketIds.set(ids);
      },
      error: (err) => console.error('Failed to load cart', err),
    });
  }

  addTicket(eventId: string) {
    const previousIds = this.ticketIds();

    this.ticketIds.update((ids) => [...ids, eventId]);

    this.http.post(this.ticketsUrl, { eventId }).subscribe({
      next: () => console.log('Ticket synced to backend'),
      error: (err) => {
        console.error('Sync failed, reverting state', err);
        this.ticketIds.set(previousIds);
        alert('Failed to add ticket to cart.');
      },
    });
  }
}
