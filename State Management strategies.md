# Angular 20 State Management: Signals & NgRx SignalStore Assessment

## Executive Summary

This document provides a comprehensive assessment of state management approaches for Angular 20 applications, with a focus on Angular Signals and NgRx SignalStore. It's designed for teams familiar with RxJS and classic NgRx Global Store, offering clear comparisons and practical guidance for adopting modern state management patterns.

---

## 1. Understanding Angular Signals

### What are Angular Signals?

Angular Signals are a reactive primitive introduced in Angular 16 and matured through version 20. They provide a simple, efficient way to manage and track state changes with fine-grained reactivity. A signal is essentially a wrapper around a value that notifies consumers when that value changes.

```typescript
import { Injectable, computed, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterState {
  // Creating a signal
  readonly count = signal(0);

  // Computed signals (derived state)
  readonly doubleCount = computed(() => this.count() * 2);

  constructor() {
    // Effects must be created in an injection context (e.g., component/service)
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }

  // Updating a signal
  setCount(value: number) {
    this.count.set(value);
  }

  increment() {
    this.count.update((value) => value + 1);
  }
}
```

### Signals vs RxJS State Management

#### Similarities

Both Signals and RxJS primitives (like BehaviorSubject) are designed to manage reactive state:

**BehaviorSubject Pattern:**

```typescript
import { BehaviorSubject } from 'rxjs';

const count$ = new BehaviorSubject(0);

// Subscribe to changes
count$.subscribe((value) => console.log(value));

// Update value
count$.next(5);

// Get current value
console.log(count$.getValue());
```

**Signal Pattern:**

```typescript
import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterState {
  readonly count = signal(0);

  constructor() {
    // React to changes
    effect(() => console.log(this.count()));
  }

  setCount(value: number) {
    this.count.set(value);
  }
}
```

#### Key Differences

| Aspect                | Angular Signals                       | RxJS (BehaviorSubject/Subject)              |
| --------------------- | ------------------------------------- | ------------------------------------------- |
| **Syntax**            | Synchronous, function-based `count()` | Observable-based `count$.subscribe()`       |
| **Change Detection**  | Automatic, fine-grained               | Requires Zone.js or manual marking          |
| **Memory Management** | Automatic cleanup                     | Manual unsubscription required              |
| **Learning Curve**    | Simpler, more intuitive               | Steeper, requires understanding observables |
| **Composition**       | `computed()` for derived state        | RxJS operators (`map`, `combineLatest`)     |
| **Performance**       | Optimized for Angular's rendering     | Can have overhead with many subscriptions   |

### When Signals Make State Management Easier

**1. Simple Component State**

With RxJS:

```typescript
export class UserProfileComponent {
  private nameSubject = new BehaviorSubject<string>('');
  name$ = this.nameSubject.asObservable();

  private ageSubject = new BehaviorSubject<number>(0);
  age$ = this.ageSubject.asObservable();

  displayText$ = combineLatest([this.name$, this.age$]).pipe(
    map(([name, age]) => `${name} is ${age} years old`),
  );

  updateName(name: string) {
    this.nameSubject.next(name);
  }

  ngOnDestroy() {
    this.nameSubject.complete();
    this.ageSubject.complete();
  }
}
```

With Signals:

```typescript
export class UserProfileComponent {
  name = signal('');
  age = signal(0);

  displayText = computed(() => `${this.name()} is ${this.age()} years old`);

  updateName(name: string) {
    this.name.set(name);
  }

  // No cleanup needed!
}
```

**2. Derived State**

Signals excel at creating computed values without the complexity of RxJS operators:

```typescript
// With Signals - clean and synchronous
const items = signal([1, 2, 3, 4, 5]);
const total = computed(() => items().reduce((sum, item) => sum + item, 0));
const average = computed(() => total() / items().length);
const hasItems = computed(() => items().length > 0);
```

**3. Template Integration**

```typescript
// Component
export class ProductListComponent {
  products = signal<Product[]>([]);
  filter = signal('');

  filteredProducts = computed(() =>
    this.products().filter((p) => p.name.toLowerCase().includes(this.filter().toLowerCase())),
  );
}
```

```html
<!-- Template - no async pipe needed -->
<input [ngModel]="filter()" (ngModelChange)="filter.set($event)" />

@for (product of filteredProducts(); track product.id ?? $index) {
<div>{{ product.name }}</div>
}
```

### When RxJS is More Effective

Despite the advantages of Signals, RxJS remains the better choice for certain scenarios:

**1. Asynchronous Operations & Data Streams**

```typescript
// RxJS excels at handling HTTP requests and async operations
searchTerm$ = new Subject<string>();

searchResults$ = this.searchTerm$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) => this.searchService.search(term)),
  catchError((error) => of([])),
);
```

**2. Complex Event Handling**

```typescript
// Multiple event sources with sophisticated timing
const mouseMove$ = fromEvent(document, 'mousemove');
const mouseDown$ = fromEvent(document, 'mousedown');
const mouseUp$ = fromEvent(document, 'mouseup');

const drag$ = mouseDown$.pipe(switchMap(() => mouseMove$.pipe(takeUntil(mouseUp$))));
```

**3. WebSocket and Real-time Data**

```typescript
// Continuous data streams
const stockPrices$ = webSocketSubject('wss://api.example.com/stocks').pipe(
  retry({ delay: 1000 }),
  share(),
);
```

**4. Time-based Operations**

```typescript
// Polling, intervals, timeouts
const autoSave$ = interval(30000).pipe(switchMap(() => this.saveService.save(this.getData())));
```

**Best Practice:** Use Signals for synchronous state management and RxJS for asynchronous operations. They can work together effectively:

```typescript
export class DataComponent {
  // Signal for local state
  isLoading = signal(false);
  data = signal<Data[]>([]);

  // RxJS for async operations
  private refreshTrigger$ = new Subject<void>();

  constructor(private dataService: DataService) {
    // Modern Angular: ensure subscriptions are cleaned up automatically
    // (requires `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';`)
    this.refreshTrigger$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(() => this.dataService.fetchData()),
        tap((result) => {
          this.data.set(result);
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  refresh() {
    this.refreshTrigger$.next();
  }
}
```

---

## 2. NgRx SignalStore Overview

### What is NgRx SignalStore?

NgRx SignalStore is a lightweight, opinionated state management solution built on Angular Signals. It provides a structured API for managing application state with significantly less boilerplate than classic NgRx Store while maintaining predictability and testability.

### Core Concepts

**1. Creating a Store**

```typescript
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';

// Define the state interface
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

// Create the store
export const TodoStore = signalStore(
  { providedIn: 'root' },

  // Initial state
  withState<TodoState>({
    todos: [],
    filter: 'all',
  }),

  // Computed values (derived state)
  withComputed(({ todos, filter }) => ({
    filteredTodos: computed(() => {
      const allTodos = todos();
      const currentFilter = filter();

      if (currentFilter === 'active') {
        return allTodos.filter((t) => !t.completed);
      }
      if (currentFilter === 'completed') {
        return allTodos.filter((t) => t.completed);
      }
      return allTodos;
    }),

    activeCount: computed(() => todos().filter((t) => !t.completed).length),
  })),

  // Methods (actions)
  withMethods((store) => ({
    addTodo(title: string) {
      const newTodo = { id: Date.now(), title, completed: false };
      patchState(store, { todos: [...store.todos(), newTodo] });
    },

    toggleTodo(id: number) {
      patchState(store, {
        todos: store.todos().map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      });
    },

    setFilter(filter: TodoState['filter']) {
      patchState(store, { filter });
    },
  })),
);
```

**2. Using the Store in Components**

```typescript
@Component({
  selector: 'app-todo-list',
  template: `
    <input #input (keyup.enter)="addTodo(input.value); input.value = ''" />

    @for (todo of store.filteredTodos(); track todo.id) {
      <div>
        <input type="checkbox" [checked]="todo.completed" (change)="store.toggleTodo(todo.id)" />
        {{ todo.title }}
      </div>
    }

    <p>Active: {{ store.activeCount() }}</p>

    <button (click)="store.setFilter('all')">All</button>
    <button (click)="store.setFilter('active')">Active</button>
    <button (click)="store.setFilter('completed')">Completed</button>
  `,
})
export class TodoListComponent {
  store = inject(TodoStore);

  addTodo(title: string) {
    if (title.trim()) {
      this.store.addTodo(title.trim());
    }
  }
}
```

### Key Features That Simplify Development

**1. Less Boilerplate**

No need for separate action files, reducer files, effect files, and selectors. Everything is defined in one place with a clear, functional API.

**2. Type Safety**

Full TypeScript type inference throughout the store definition and usage.

```typescript
export const UserStore = signalStore(
  withState({ user: null as User | null }),
  withMethods((store) => ({
    setUser(user: User) {
      patchState(store, { user });
      // TypeScript knows the shape of state
    },
  })),
);

// In component
const userStore = inject(UserStore);
const currentUser = userStore.user(); // Type is User | null
```

**3. Built-in Entity Management**

```typescript
import { signalStore, withEntities, withMethods } from '@ngrx/signals';
import { addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withEntities<Product>(),
  withMethods((store) => ({
    addProduct(product: Product) {
      patchState(store, addEntity(product));
    },
    updateProduct(id: number, changes: Partial<Product>) {
      patchState(store, updateEntity({ id, changes }));
    },
    removeProduct(id: number) {
      patchState(store, removeEntity(id));
    },
  })),
);
```

**4. Integration with RxJS**

SignalStore works seamlessly with RxJS for async operations:

```typescript
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState({ products: [], isLoading: false }),
  withMethods((store, productService = inject(ProductService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() => productService.getProducts()),
        tap((products) => patchState(store, { products, isLoading: false })),
      ),
    ),
  })),
);
```

---

## 3. NgRx SignalStore vs Classic NgRx Global Store

### The Fundamental Architectural Mismatch

Before diving into comparisons, it's critical to understand why mixing Angular Signals with classic NgRx Global Store creates architectural friction that NgRx SignalStore elegantly resolves.

#### The Core Problem: Two Reactive Systems Fighting Each Other

Classic NgRx Store is built entirely on RxJS Observables. When you adopt Angular Signals as your primary reactivity model, you're essentially running two parallel reactive systems:

**The Impedance Mismatch:**

```typescript
// Classic NgRx with Signals - Fighting the framework
@Component({
  template: `
    <!-- Signals work naturally -->
    <p>User: {{ userName() }}</p>

    <!-- RxJS requires async pipe -->
    <p>Cart Items: {{ cartItems$ | async }}</p>
  `,
})
export class MixedComponent {
  // Signal-based local state - natural, synchronous
  userName = signal('John');

  // Observable-based global state - requires subscription management
  cartItems$ = this.store.select(selectCartItems);

  constructor(private store: Store) {}

  // Awkward bridging between the two systems
  updateDisplay() {
    // Signal: direct, synchronous access
    const name = this.userName();

    // Observable: requires subscription
    this.cartItems$.pipe(take(1)).subscribe((items) => {
      // Now we can work with both...
      console.log(name, items);
    });
  }
}
```

**Why This Matters:**

1. **Cognitive Load:** Developers must context-switch between two different mental models
2. **Inconsistent Patterns:** Some state uses `signal()`, other state uses `| async`
3. **Integration Complexity:** Combining signal and observable state requires manual bridging
4. **Performance Overhead:** Running two change detection systems simultaneously
5. **Increased Boilerplate:** Converting between observables and signals adds code

#### NgRx SignalStore: Unified Reactive Architecture

NgRx SignalStore eliminates this mismatch by building state management **on top of** Angular Signals:

```typescript
// Everything is signal-based - cohesive architecture
@Component({
  template: `
    <!-- Everything works the same way -->
    <p>User: {{ userName() }}</p>
    <p>Cart Items: {{ cartStore.items() }}</p>
  `,
})
export class UnifiedComponent {
  // All state is signal-based - consistent patterns
  userName = signal('John');
  cartStore = inject(CartStore);

  // Natural integration - everything is synchronous
  updateDisplay() {
    const name = this.userName();
    const items = this.cartStore.items();
    console.log(name, items); // Simple, direct access
  }
}
```

### The Path Forward: Why SignalStore Aligns with Angular's Future

Angular's framework evolution clearly signals (pun intended) the direction:

**Angular 16-20 Trajectory:**

- ✅ Signals introduced as the new reactive primitive
- ✅ Signal-based components and inputs
- ✅ Signal-based queries (`viewChild`, `contentChildren`)
- ✅ Signal-based forms (upcoming)
- ✅ Zoneless change detection powered by signals

**The Inevitable Conclusion:** If your components, inputs, queries, and eventually forms are all signal-based, why would your state management be observable-based?

### Comparison Overview

| Feature                   | NgRx SignalStore           | Classic NgRx Store                                     |
| ------------------------- | -------------------------- | ------------------------------------------------------ |
| **Setup Complexity**      | Minimal, single file       | Multiple files (actions, reducers, effects, selectors) |
| **Boilerplate**           | Very low                   | High                                                   |
| **Learning Curve**        | Gentle                     | Steep                                                  |
| **State Scope**           | Feature or component level | Global application state                               |
| **Performance**           | Fine-grained reactivity    | Optimized but requires careful selector usage          |
| **DevTools**              | Limited (emerging)         | Excellent (Redux DevTools)                             |
| **Time Travel Debugging** | Not built-in               | Full support                                           |
| **Scalability**           | Best for feature stores    | Excellent for large applications                       |
| **Testing**               | Simple, straightforward    | More complex setup                                     |

### Detailed Comparison with Examples

#### Example Scenario: Shopping Cart Management

**Classic NgRx Global Store Implementation:**

```typescript
// cart.actions.ts
export const addToCart = createAction(
  '[Cart] Add Item',
  props<{ product: Product; quantity: number }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove Item',
  props<{ productId: number }>()
);

export const updateQuantity = createAction(
  '[Cart] Update Quantity',
  props<{ productId: number; quantity: number }>()
);

export const loadCart = createAction('[Cart] Load Cart');
export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ items: CartItem[] }>()
);

// cart.reducer.ts
export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null
};

export const cartReducer = createReducer(
  initialState,
  on(addToCart, (state, { product, quantity }) => ({
    ...state,
    items: [...state.items, { product, quantity }]
  })),
  on(removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter(item => item.product.id !== productId)
  })),
  on(updateQuantity, (state, { productId, quantity }) => ({
    ...state,
    items: state.items.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    )
  })),
  on(loadCart, (state) => ({ ...state, loading: true })),
  on(loadCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false
  }))
);

// cart.selectors.ts
export const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCartItems = createSelector(
  selectCartState,
  (state) => state.items
);

export const selectCartTotal = createSelector(
  selectCartItems,
  (items) => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
);

export const selectCartItemCount = createSelector(
  selectCartItems,
  (items) => items.reduce((sum, item) => sum + item.quantity, 0)
);

// cart.effects.ts
@Injectable()
export class CartEffects {
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCart),
      switchMap(() =>
        this.cartService.loadCart().pipe(
          map(items => loadCartSuccess({ items })),
          catchError(error => of(loadCartFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private cartService: CartService
  ) {}
}

// Component usage
@Component({...})
export class CartComponent {
  items$ = this.store.select(selectCartItems);
  total$ = this.store.select(selectCartTotal);
  itemCount$ = this.store.select(selectCartItemCount);

  constructor(private store: Store) {}

  addItem(product: Product) {
    this.store.dispatch(addToCart({ product, quantity: 1 }));
  }

  removeItem(productId: number) {
    this.store.dispatch(removeFromCart({ productId }));
  }
}
```

**NgRx SignalStore Implementation:**

```typescript
// cart.store.ts
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed, inject } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';

interface CartState {
  items: CartItem[];
  loading: boolean;
}

export const CartStore = signalStore(
  { providedIn: 'root' },

  withState<CartState>({
    items: [],
    loading: false
  }),

  withComputed(({ items }) => ({
    total: computed(() =>
      items().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    ),
    itemCount: computed(() =>
      items().reduce((sum, item) => sum + item.quantity, 0)
    )
  })),

  withMethods((store, cartService = inject(CartService)) => ({
    addToCart(product: Product, quantity = 1) {
      patchState(store, {
        items: [...store.items(), { product, quantity }]
      });
    },

    removeFromCart(productId: number) {
      patchState(store, {
        items: store.items().filter(item => item.product.id !== productId)
      });
    },

    updateQuantity(productId: number, quantity: number) {
      patchState(store, {
        items: store.items().map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      });
    },

    loadCart: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => cartService.loadCart()),
        tap(items => patchState(store, { items, loading: false }))
      )
    )
  }))
);

// Component usage
@Component({...})
export class CartComponent {
  store = inject(CartStore);

  addItem(product: Product) {
    this.store.addToCart(product);
  }

  removeItem(productId: number) {
    this.store.removeFromCart(productId);
  }
}
```

```html
<!-- Template -->
@for (item of store.items(); track item.product.id) {
<div>
  {{ item.product.name }} - Qty: {{ item.quantity }}
  <button (click)="removeItem(item.product.id)">Remove</button>
</div>
}

<p>Total Items: {{ store.itemCount() }}</p>
<p>Total Price: {{ store.total() | currency }}</p>
```

**Key Observations:**

1. **Code Reduction:** SignalStore reduces the implementation from 5 files to 1 file
2. **Simpler Mental Model:** Direct method calls instead of action dispatching
3. **Immediate Access:** Use `store.items()` directly instead of subscribing to observables
4. **Less Ceremony:** No need for action creators, action types, or selector functions
5. **Architectural Consistency:** Everything is signal-based, matching your component architecture

### The Critical Advantage: Seamless Signal Integration

When you commit to Angular Signals, NgRx SignalStore provides seamless integration that classic NgRx cannot match:

#### Example: Building a Dashboard with Computed State

**With Classic NgRx (Observable-based):**

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Mixed reactive paradigms -->
    <h2>Welcome {{ userName() }}</h2>
    <p>You have {{ (notifications$ | async)?.length }} notifications</p>
    <p>Status: {{ status() }}</p>

    <!-- Complex derived state requires combineLatest -->
    @if (dashboardSummary$ | async; as summary) {
      <div>{{ summary.message }}</div>
    }
  `,
})
export class DashboardComponent {
  // Signal-based component state
  userName = signal('John Doe');
  status = signal('active');

  // Observable-based store state
  notifications$ = this.store.select(selectNotifications);
  tasks$ = this.store.select(selectTasks);

  // Combining signals and observables is awkward
  dashboardSummary$ = combineLatest([
    this.notifications$,
    this.tasks$,
    toObservable(this.status), // Convert signal to observable!
  ]).pipe(
    map(([notifications, tasks, status]) => ({
      message: `${notifications.length} notifications, ${tasks.length} tasks`,
    })),
  );

  constructor(private store: Store) {}

  // Action requires converting signal to value then dispatching
  updatePreference() {
    const currentStatus = this.status(); // Get signal value
    this.store.dispatch(updateUserStatus({ status: currentStatus }));
  }
}
```

**With NgRx SignalStore (Signal-based):**

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Unified reactive paradigm -->
    <h2>Welcome {{ userName() }}</h2>
    <p>You have {{ dashboardStore.notifications().length }} notifications</p>
    <p>Status: {{ status() }}</p>

    <!-- Computed state just works -->
    <div>{{ dashboardStore.summary() }}</div>
  `,
})
export class DashboardComponent {
  // All state is signal-based - perfect consistency
  userName = signal('John Doe');
  status = signal('active');
  dashboardStore = inject(DashboardStore);

  // No conversions needed - signals compose naturally
  // (computed logic in the store itself)

  updatePreference() {
    // Direct method call with signal value
    this.dashboardStore.updateUserStatus(this.status());
  }
}

// Store definition
export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    notifications: [] as Notification[],
    tasks: [] as Task[],
  }),
  withComputed(({ notifications, tasks }) => ({
    // Computed values compose naturally with other signals
    summary: computed(() => `${notifications().length} notifications, ${tasks().length} tasks`),
  })),
  withMethods((store) => ({
    updateUserStatus(status: string) {
      // Direct state update, no action boilerplate
      // Could trigger API call here
    },
  })),
);
```

**The Difference:**

- **No `| async` pipes** - Everything is synchronous signal access
- **No `combineLatest`** - Signals compose with `computed()`
- **No conversion functions** - No need for `toObservable()` or similar bridges
- **Consistent patterns** - Template syntax is identical for all state

#### Example: Reactive Forms with Derived Validation

**With Classic NgRx (Fighting the system):**

```typescript
@Component({
  template: `
    <input [formControl]="emailControl" />
    @if (isEmailTaken$ | async) {
      <p>Email is taken</p>
    }
    <button [disabled]="!canSubmit()">Submit</button>
  `,
})
export class RegistrationComponent {
  // Signal-based form control (Angular's direction)
  emailControl = new FormControl('');

  // Observable-based store state
  existingEmails$ = this.store.select(selectExistingEmails);

  // Awkward: Convert FormControl value to Observable to combine with store
  private emailValue$ = this.emailControl.valueChanges;

  isEmailTaken$ = combineLatest([this.emailValue$, this.existingEmails$]).pipe(
    map(([email, existing]) => existing.includes(email)),
  );

  // Awkward: Need to combine observable store state with signal for computed
  canSubmit = computed(() => {
    // Can't easily access observable values in computed!
    // Need to maintain separate subscription or use workarounds
    return this.emailControl.valid;
  });

  constructor(private store: Store) {}
}
```

**With NgRx SignalStore (Natural integration):**

```typescript
@Component({
  template: `
    <input [formControl]="emailControl" />
    @if (formStore.isEmailTaken()) {
      <p>Email is taken</p>
    }
    <button [disabled]="!formStore.canSubmit()">Submit</button>
  `,
})
export class RegistrationComponent {
  emailControl = new FormControl('');
  formStore = inject(RegistrationFormStore);

  // Convert the FormControl stream into a signal
  // (requires `import { toSignal } from '@angular/core/rxjs-interop';`)
  private readonly email = toSignal(this.emailControl.valueChanges, {
    initialValue: this.emailControl.value ?? '',
  });

  constructor() {
    // Update store when the signal changes
    effect(() => {
      this.formStore.updateEmail(this.email());
    });
  }
}

export const RegistrationFormStore = signalStore(
  withState({
    email: '',
    existingEmails: [] as string[],
    isValid: false,
  }),
  withComputed(({ email, existingEmails, isValid }) => ({
    // Everything composes naturally
    isEmailTaken: computed(() => existingEmails().includes(email())),
    canSubmit: computed(() => isValid() && !existingEmails().includes(email())),
  })),
  withMethods((store) => ({
    updateEmail(email: string) {
      patchState(store, { email });
    },
  })),
);
```

**The Difference:**

- **Natural composition** - All derived state uses `computed()`
- **No subscription management** - Effects handle reactivity automatically
- **Unified validation logic** - All validation state in one reactive system
- **Simpler mental model** - Everything is synchronous and signal-based

### Why This Matters for Your Team

If you've committed to Angular Signals for your components (which you should in Angular 20), using classic NgRx creates a split architecture:

**Split Architecture Problems:**

```
Component Layer:     Signals ← [Conversion Layer] → Observables     :Store Layer
     ↓                           ↓                        ↓
  (Natural)              (Friction & Boilerplate)      (Legacy Pattern)
```

**Unified Architecture Benefits:**

```
Component Layer:     Signals ←───────────────────→ Signals     :Store Layer
     ↓                                                   ↓
  (Natural)                                        (Natural)
```

The unified architecture means:

- ✅ **Faster Development:** No mental context switching
- ✅ **Easier Onboarding:** One reactive model to learn
- ✅ **Better Performance:** Single change detection system
- ✅ **Future-Proof:** Aligned with Angular's roadmap
- ✅ **Less Code:** No conversion/bridging logic needed

### Pros and Cons

#### NgRx SignalStore

**Pros:**

- ✅ Minimal boilerplate and setup
- ✅ Intuitive API that's easy to learn
- ✅ Perfect for feature-level state management
- ✅ Excellent TypeScript inference
- ✅ Automatic change detection optimization
- ✅ No manual subscription management
- ✅ Easier to test (simple function calls)
- ✅ Colocated code (everything in one place)

**Cons:**

- ❌ Limited DevTools support (still maturing)
- ❌ No time-travel debugging out of the box
- ❌ Less suitable for complex cross-cutting concerns
- ❌ Smaller ecosystem and community compared to classic Store
- ❌ Fewer middleware options
- ❌ Not ideal for very large, interconnected state graphs

#### Classic NgRx Global Store

**Pros:**

- ✅ Excellent DevTools with time-travel debugging
- ✅ Proven architecture for large-scale applications
- ✅ Comprehensive middleware ecosystem
- ✅ Perfect for global, cross-cutting state
- ✅ Well-established patterns and best practices
- ✅ Strong separation of concerns
- ✅ Easier to audit state changes through actions
- ✅ Better for teams that need strict state governance

**Cons:**

- ❌ Significant boilerplate (actions, reducers, effects, selectors)
- ❌ Steep learning curve for new developers
- ❌ More files to maintain per feature
- ❌ Manual subscription management required
- ❌ Can be overkill for simple features
- ❌ Requires careful selector optimization for performance
- ❌ More complex testing setup

### When to Use Each

#### Use NgRx SignalStore When:

- **You've committed to Angular Signals** (and you should in Angular 20) ← **PRIMARY REASON**
- You want architectural consistency across your entire application
- Building feature-specific state (user preferences, form state, UI state)
- Working on small to medium complexity features
- Team prefers less boilerplate and faster development
- State is primarily synchronous with occasional async operations
- You want easier onboarding for new developers
- You're building a new application with Angular 16+
- You want to avoid the friction of bridging signals and observables

**The Bottom Line:** If your components use signals (inputs, queries, local state), your store should too.

**Example Use Cases:**

```typescript
// Feature toggle store
export const FeatureToggleStore = signalStore(...);

// User preferences store
export const UserPreferencesStore = signalStore(...);

// Component-level UI state
export const DataTableStore = signalStore(...);

// Form state management
export const FormStore = signalStore(...);
```

#### Use Classic NgRx Global Store When:

- You're maintaining a **legacy application** already invested in NgRx patterns
- Need sophisticated DevTools and time-travel debugging for **critical debugging scenarios**
- Have complex cross-cutting concerns that truly need global orchestration
- Require extensive middleware integration that doesn't exist for SignalStore
- Team has deep NgRx expertise and resists change
- **Note:** Most teams overestimate how often they need these features

**Important Caveat:** Even these use cases don't justify the architectural split if you're using signals everywhere else. Consider whether the DevTools benefit outweighs the architectural friction.

**Example Use Cases:**

```typescript
// Only if you truly need global state with time-travel debugging
export const authReducer = createReducer(...);

// Only if you need sophisticated action audit trails
export const orderManagementReducer = createReducer(...);
```

### Hybrid Approach

**Recommendation:** Avoid hybrid approaches in new applications. The architectural split creates more problems than it solves.

If you must use both (typically only in migration scenarios):

```typescript
// Global store for legacy/critical state only
@NgModule({
  imports: [
    StoreModule.forRoot({
      auth: authReducer, // Only critical global state
    }),
  ],
})
// SignalStore for everything else
@Component({
  providers: [ProductFilterStore],
})
export class ProductListComponent {
  // Minimize this pattern - it creates architectural friction
  globalAuth = inject(Store).select(selectAuthState);
  filterStore = inject(ProductFilterStore); // Preferred approach
}
```

**Better Approach - Full SignalStore:**

```typescript
// Even "global" state can be SignalStore
export const AuthStore = signalStore({ providedIn: 'root' }, ...);

@Component({...})
export class ProductListComponent {
  // Consistent, signal-based architecture throughout
  authStore = inject(AuthStore);
  filterStore = inject(ProductFilterStore);

  // Everything composes naturally
  canEdit = computed(() =>
    this.authStore.isAdmin() && this.filterStore.hasSelection()
  );
}
```

---

## 4. Recommendations for Your Angular 20 Application

### Primary Recommendation: Use NgRx SignalStore Exclusively

For a new Angular 20 application, NgRx SignalStore should be your **only** state management solution. Here's why this is not just a preference, but an architectural imperative:

### The Architectural Imperative

**You've Already Committed to Signals** when you chose Angular 20:

```typescript
// Your components already use signals everywhere:

@Component({...})
export class UserComponent {
  // Signal-based inputs
  readonly userId = input.required<string>();

  // Signal-based queries
  readonly userCard = viewChild.required<UserCardComponent>('card');

  // Signal-based local state
  isEditing = signal(false);
  formData = signal({...});

  // Signal-based computed values
  displayName = computed(() =>
    `${this.formData().firstName} ${this.formData().lastName}`
  );

  // WHY would your store state use a different system?
  // cartItems$ = this.store.select(...) // ← Architectural mismatch!

  // INSTEAD: Keep everything consistent
  cartStore = inject(CartStore);
  items = this.cartStore.items(); // ← Natural, consistent
}
```

**The Question Isn't "Should We Use SignalStore?"**

The question is: **"Why would we introduce observables when everything else is signals?"**

### The Clear Path Forward

**1. Architectural Consistency = Faster Development**

```typescript
// SPLIT ARCHITECTURE (Classic NgRx + Signals)
// Two systems, constant friction

@Component({...})
export class ProductComponent {
  // Component state: Signals
  quantity = signal(1);

  // Store state: Observables
  product$ = this.store.select(selectProduct);

  // Combining them: Awkward bridging code
  total$ = combineLatest([
    this.product$,
    toObservable(this.quantity) // ← Conversion boilerplate
  ]).pipe(
    map(([product, qty]) => product.price * qty)
  );
}
```

```typescript
// UNIFIED ARCHITECTURE (SignalStore)
// One system, natural composition

@Component({...})
export class ProductComponent {
  // Component state: Signals
  quantity = signal(1);

  // Store state: Signals
  productStore = inject(ProductStore);

  // Combining them: Natural, no conversion
  total = computed(() =>
    this.productStore.currentProduct().price * this.quantity()
  );
}
```

**2. Team Velocity Benefits**

When you use SignalStore exclusively:

- **No context switching** between reactive paradigms
- **No conversion logic** between signals and observables
- **No async pipes** to remember when to use
- **No subscription management** complexity
- **One mental model** for all state
- **Faster onboarding** for new developers
- **Less debugging** of reactive composition issues

**Concrete Example:**

```typescript
// Time to implement a feature with split architecture:
// 1. Write component with signals (10 min)
// 2. Write actions/reducers/selectors with observables (30 min)
// 3. Bridge signals and observables (15 min)
// 4. Debug reactive composition issues (20 min)
// TOTAL: 75 minutes

// Time to implement with unified SignalStore:
// 1. Write component with signals (10 min)
// 2. Write SignalStore (15 min)
// 3. Use store in component (5 min)
// TOTAL: 30 minutes
```

**3. Future-Proof Architecture**

Angular's roadmap makes it clear - signals are the future:

```
Angular 16: Signals introduced
Angular 17: Signal inputs, queries
Angular 18: Signal-based zoneless
Angular 19: Enhanced signal APIs
Angular 20: Signal forms (upcoming)
Angular 21+: Full signal-based framework

Where does Observable-based NgRx fit in this future? It doesn't.
```

### Implementation Strategy

**Phase 1: Commit to SignalStore (Day 1)**

- Establish SignalStore as the **only** state management approach
- Create architectural guidelines document
- Set up project templates and generators for SignalStore
- Configure linting rules to prevent classic NgRx usage

**Phase 2: Build Patterns Library (Week 1-2)**

- Create reusable store patterns:
  - Entity management stores
  - Form state stores
  - UI state stores
  - Async operation stores
- Document common recipes
- Build shared utilities

**Phase 3: Team Enablement (Ongoing)**

- Conduct SignalStore workshops
- Code review with focus on signal patterns
- Create example implementations
- Document anti-patterns to avoid

### Architectural Guidelines

**DO:**

```typescript
// ✅ SignalStore for feature state
export const UserPreferencesStore = signalStore(...);

// ✅ SignalStore for "global" state
export const AuthStore = signalStore({ providedIn: 'root' }, ...);

// ✅ SignalStore for complex state
export const OrderManagementStore = signalStore(...);

// ✅ RxJS for async operations (via rxMethod)
export const DataStore = signalStore(
  withMethods((store, api = inject(ApiService)) => ({
    load: rxMethod<string>(
      pipe(
        switchMap(id => api.getData(id)),
        tap(data => patchState(store, { data }))
      )
    )
  }))
);
```

**DON'T:**

```typescript
// ❌ Classic NgRx Store
export const userReducer = createReducer(...);

// ❌ Mixing SignalStore and classic NgRx
@Component({...})
export class MixedComponent {
  signalStore = inject(UserStore);
  classicStore = inject(Store); // ← Creates architectural split
}

// ❌ BehaviorSubjects for shared state
export class DataService {
  private data$ = new BehaviorSubject(...); // ← Use SignalStore instead
}
```

### Example Architecture

```typescript
// Project structure with SignalStore
src / app / features / products / stores / product - list.store.ts; // Feature store
product - filter.store.ts; // UI state store
cart / stores / cart.store.ts; // Feature store
shared / stores / auth.store.ts; // App-wide store
notification.store.ts; // App-wide store
core / stores / config.store.ts; // App configuration store
```

**All stores follow the same pattern:**

```typescript
export const FeatureStore = signalStore(
  { providedIn: 'root' }, // or component-level
  withState(...),
  withComputed(...),
  withMethods(...)
);
```

### Addressing Common Concerns

**"What about DevTools?"**

- SignalStore DevTools support is improving rapidly
- Most teams overestimate how often they use time-travel debugging
- The productivity gains far outweigh this limitation
- For critical debugging, add custom logging to store methods

**"What about complex global state?"**

- SignalStore handles complexity just fine
- `providedIn: 'root'` makes it global
- Computed signals handle derived state elegantly
- RxJS integration via `rxMethod` handles async complexity

**"What about our team's NgRx expertise?"**

- SignalStore concepts transfer (state, actions, derived state)
- Much simpler, so easier to learn
- Frees team to focus on business logic vs. boilerplate
- Investment in signals pays dividends across entire Angular ecosystem

### Migration Path for Teams

### For Teams Coming from RxJS/BehaviorSubject

1. **Map Concepts:**
   - `BehaviorSubject` → `signal()`
   - `combineLatest()` → `computed()`

- `.subscribe()` → `toSignal()` for state, or `.pipe(takeUntilDestroyed())` for side effects

2. **Start Small:**
   - Convert one component's local state to signals
   - Experience the benefits firsthand
   - Gradually adopt across features

### For Teams Coming from Classic NgRx

1. **Keep Global Store:**
   - Don't migrate existing working code unnecessarily
   - Use classic Store for established global state

2. **New Features with SignalStore:**
   - All new features use SignalStore
   - Compare developer experience
   - Measure productivity improvements

3. **Gradual Feature Migration:**
   - Migrate isolated features when refactoring
   - Start with UI-heavy, less critical features
   - Move to business-critical features after confidence builds

---

## Conclusion

Angular Signals and NgRx SignalStore represent the future of state management in Angular applications. For your Angular 20 application, the path forward is clear:

### The Decisive Factor: Architectural Consistency

**You cannot have an architecturally consistent Angular application with signals everywhere except your state management.**

When you choose Angular 20, you're choosing a signal-based framework:

- Signal inputs
- Signal queries
- Signal computed values
- Signal effects
- Signal-based change detection

**Why would your state management be the outlier using observables?**

### The Clear Recommendation

**Use NgRx SignalStore exclusively:**

1. **Architectural Consistency**
   - One reactive system throughout your application
   - No mental context switching
   - No conversion/bridging code
   - Natural composition everywhere

2. **Developer Productivity**
   - 50-70% less boilerplate than classic NgRx
   - Faster feature development
   - Easier debugging (synchronous by default)
   - Simpler onboarding

3. **Future-Proof**
   - Aligned with Angular's signal-based future
   - No technical debt from mixed paradigms
   - Investment in skills that transfer across entire Angular ecosystem

4. **Performance**
   - Fine-grained reactivity built-in
   - Single change detection system
   - No overhead from parallel reactive systems

### When Classic NgRx Still Makes Sense

**Only in these specific scenarios:**

- Maintaining existing applications already heavily invested in NgRx
- Migration phases where you're transitioning from classic NgRx to SignalStore

**Not recommended for:**

- New applications (even large/complex ones)
- "Just in case" we need DevTools someday
- Because the team knows NgRx (SignalStore is easier to learn)

### The Bottom Line

**If you're building a new Angular 20 application and using signals (which you should be), there is no compelling reason to use classic NgRx Global Store.**

The architectural friction of mixing signals and observables costs more in development velocity, maintainability, and complexity than any benefit classic NgRx provides.

**Embrace the signal-based future fully. Your codebase, your team, and your future self will thank you.**
