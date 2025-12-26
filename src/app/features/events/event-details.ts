import { Component, inject, input } from '@angular/core';
import { EventsService } from '../../core/events.service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CartService } from '../../core/cart.service';

@Component({
  selector: 'app-event-details',
  template: `
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto min-h-[600px]">
      <!-- TODO Mod 3: Use Input Binding for ID -->
      <!-- Back Button -->
      <a routerLink="/" class="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Events
      </a>

      <!--Loading State -->
      @if (eventResource.isLoading()) {
        <div class="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
      }

      <!-- Error State -->
      @if (eventResource.error()) {
        <div class="text-red-600 p-4 bg-red-50 rounded">Event not found.</div>
      }

      <!-- Success State -->
      @if (eventResource.hasValue()) {
        @let event = eventResource.value()!;
        <!-- Left: Content -->
        <div class="md:col-span-2 space-y-4">
          <h1 class="text-4xl font-bold text-gray-900">{{ event.title }}</h1>
          <p class="text-gray-500 text-lg">
            {{ event.date | date: 'fullDate' }} • {{ event.location }}
          </p>
          <p class="text-gray-700 leading-relaxed text-lg">{{ event.description }}</p>
        </div>

        <!-- Right: Actions -->
        <div class="bg-gray-50 p-6 rounded-xl h-fit border border-gray-100">
          <div class="h-48 bg-gray-200 rounded mb-4 overflow-hidden">
            <!-- We will optimize this image in Day 2 -->
            <img [src]="event.image" class="w-full h-full object-cover" />
          </div>

          <button
            (click)="addToCart()"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition"
          >
            Buy Tickets
          </button>
        </div>
      }
    </div>
  `,
  imports: [RouterLink, DatePipe],
})
export class EventDetails {
  private readonly eventService = inject(EventsService);
  private readonly cartService = inject(CartService);

  readonly id = input.required<string>();

  readonly eventResource = this.eventService.getEventResource(this.id);

  addToCart() {
    this.cartService.addTicket(this.id());
  }
}
