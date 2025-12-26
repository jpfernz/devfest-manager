import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { DevFestEvent } from '../models/event.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/events';

  getEventsResource(query: Signal<string>) {
    return httpResource<DevFestEvent[]>(() => {
      const q = query();
      return q ? `${this.apiUrl}?q=${q}` : this.apiUrl;
    });
  }

  getEventResource(id: Signal<string>) {
    return httpResource<DevFestEvent>(() => {
      const eventId = id();
      if (!eventId) return undefined;
      return `${this.apiUrl}/${eventId}`;
    });
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
