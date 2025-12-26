import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-event-card',
  imports: [DatePipe, RouterLink, NgOptimizedImage],
  template: `
    <div
      class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <!-- TODO: Add Image -->
      <img
        [ngSrc]="image()"
        width="500"
        height="200"
        priority
        class="object-cover w-full h-full max-h-full max-w-full"
        alt="Event thumbnail"
      />

      <div class="p-6">
        <div class="flex justify-between items-center mt-4">
          <!-- TODO Mod 1: Add Date using DatePipe -->
          <p class="text-sm text-blue-600 font-semibold mb-2">
            {{ (date() | date: 'mediumDate') || 'TBA' }}
          </p>

          <!-- TODO Mod 1: Add daysUntil() using @let -->
          @let days = daysUntil();
          @if (days !== null) {
            <div
              class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm"
            >
              @if (days > 0) {
                In {{ days }} Days
              } @else if (days < 0) {
                Past event
              } @else {
                Happening Now!
              }
            </div>
          }
        </div>

        <!-- TODO Mod 1: Add Title Input -->
        <h3 class="text-xl font-bold text-gray-800 my-2">{{ title() }}</h3>

        <div class="flex justify-between items-center mt-4">
          <!-- TODO Mod 1: Add Derived State (Like Button) -->
          <button
            class="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            (click)="toggleFavorite()"
            [class.text-red-500]="isFavorite()"
          >
            <span>{{ isFavorite() ? '❤️' : '♥︎' }}</span>
            Like
          </button>

          <!-- TODO Mod 1: Add Output -->
          <button
            (click)="removeEvent()"
            class="text-gray-400 text-sm hover:text-gray-600 cursor-pointer"
          >
            Remove
          </button>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 text-right">
          <a
            [routerLink]="['/event', id()]"
            class="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            View Details →
          </a>
        </div>
      </div>
    </div>
  `,
})
export class EventCard {
  readonly id = input.required<string>();
  title = input.required<string>();
  image = input.required<string>();
  date = input<string>();
  initialLike = input(false);
  delete = output<void>();
  isFavorite = linkedSignal(() => this.initialLike());

  removeEvent() {
    this.delete.emit();
  }

  toggleFavorite() {
    this.isFavorite.update((val) => !val);
  }

  daysUntil = computed(() => {
    const eventDate = this.date();
    if (!eventDate) return null;

    const today = new Date();
    const target = new Date(eventDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  });
}
