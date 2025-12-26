import { Routes } from '@angular/router';
import { EventList } from './features/events/event-list';
import { EventDetails } from './features/events/event-details';
import { CreateEvent } from './features/admin/create-event';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: EventList },
  {
    path: 'event/:id',
    loadComponent: () => import('./features/events/event-details').then((c) => c.EventDetails),
  },
  {
    path: 'admin/create',
    loadComponent: () => import('./features/admin/create-event').then((c) => c.CreateEvent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
