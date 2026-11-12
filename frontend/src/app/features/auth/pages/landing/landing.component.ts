import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../../../core/services/auth.service';
import { FoodService } from '../../../../core/services/food.service';
import { CO2_KG_PER_MEAL, co2Saved } from '../../../../shared/utils/date.utils';
import { FOOD_TYPES } from '../../../../shared/utils/food.constants';
import { foodImage } from '../../../../shared/utils/food-image';
import { prefersReducedMotion } from '../../../../shared/utils/motion';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';
import { TiltDirective } from '../../../../shared/directives/tilt.directive';

interface ImpactStats {
  mealsSaved: number;
  listings: number;
  donors: number;
  co2Kg: number;
}

const STEP_MS = 4500;
const WORD_MS = 2200;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule,
    MatSliderModule, MatExpansionModule, RevealDirective, CountUpDirective, TiltDirective
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly dashboardLink = computed(() => this.authService.homeRouteFor(this.authService.role()));
  readonly co2PerMeal = CO2_KG_PER_MEAL;

  /** Live numbers from the public listings endpoint; null while loading or if the API is down. */
  impact: ImpactStats | null = null;
  readonly liveStats = signal<{ icon: string; value: number; suffix: string; label: string }[]>([]);

  // Hero rotating word
  readonly words = ['meals', 'bread', 'produce', 'leftovers', 'groceries'];
  readonly wordIndex = signal(0);

  // Food category marquee (list doubled so the loop is seamless)
  private readonly categories = FOOD_TYPES.map(label => ({ label, img: foodImage(label) }));
  readonly marqueeCategories = [...this.categories, ...this.categories];

  readonly roles = [
    {
      key: 'donor', img: 'assets/illustrations/donor.svg', title: 'For donors',
      text: 'List your surplus food quickly and get matched with nearby NGOs automatically.',
      points: ['Create food listings in seconds', 'Smart NGO matching by location', 'Track your impact over time']
    },
    {
      key: 'receiver', img: 'assets/illustrations/receiver.svg', title: 'For receivers (NGOs)',
      text: 'Find food that is available right now and coordinate pickups efficiently.',
      points: ['Browse available food nearby', 'One-click claiming', 'Real-time notifications']
    },
    {
      key: 'admin', img: 'assets/illustrations/admin.svg', title: 'For admins',
      text: 'Monitor platform activity, analyse impact, and catch misuse early.',
      points: ['Live analytics and charts', 'Fraud detection rules', 'Pending pickup tracking']
    }
  ];

  readonly steps = [
    { icon: 'add_photo_alternate', title: 'List', text: 'A donor adds what they have, how many servings, where to pick it up and when it expires. It takes under a minute.' },
    { icon: 'hub', title: 'Match', text: 'ZeroPlate ranks nearby NGOs by distance, urgency and food type so the right people hear about it first.' },
    { icon: 'volunteer_activism', title: 'Claim', text: 'A receiver claims the listing with one click. The donor is notified in real time.' },
    { icon: 'local_shipping', title: 'Pick up', text: 'The receiver collects the food and the donor marks it picked up. The meal reaches a plate, not a bin.' }
  ];
  readonly activeStep = signal(0);
  readonly stepsPaused = signal(false);

  readonly faqs = [
    { q: 'Who can donate food?', a: 'Anyone with safe, surplus food: restaurants, caterers, supermarkets, bakeries, event organisers and households.' },
    { q: 'What kinds of food can I list?', a: 'Cooked meals, raw ingredients, packaged goods, bakery items, fruit and vegetables, dairy and beverages, as long as they are within their expiry and stored safely.' },
    { q: 'How do NGOs get matched?', a: 'When you list food, the matching engine scores registered receivers by distance, how soon the food expires and the type of food, and suggests the best fits.' },
    { q: 'Does it cost anything?', a: 'No. ZeroPlate is free for donors and receivers.' },
    { q: 'What happens if nobody claims my food?', a: 'You will see expiring listings on your dashboard and can extend, edit or mark them expired at any time.' }
  ];

  // Calculator
  readonly servings = signal(50);
  readonly peopleFed = computed(() => Math.round(this.servings() / 3));
  readonly yearCo2Tonnes = computed(() => (this.servings() * 52 * CO2_KG_PER_MEAL) / 1000);

  private stepTimer?: ReturnType<typeof setInterval>;
  private wordTimer?: ReturnType<typeof setInterval>;

  constructor(private authService: AuthService, private foodService: FoodService) { }

  ngOnInit(): void {
    if (!prefersReducedMotion()) {
      this.wordTimer = setInterval(() => this.wordIndex.update(i => (i + 1) % this.words.length), WORD_MS);
      this.startSteps();
    }

    this.foodService.getAllFoods().subscribe({
      next: (foods) => {
        const rescued = foods.filter(f => f.status === 'claimed' || f.status === 'picked_up');
        const mealsSaved = rescued.reduce((sum, f) => sum + (f.quantity || 0), 0);
        const donors = new Set(foods.map(f => (typeof f.donor === 'string' ? f.donor : f.donor?._id)).filter(Boolean));
        this.impact = {
          mealsSaved,
          listings: foods.length,
          donors: donors.size,
          co2Kg: co2Saved(mealsSaved)
        };
        this.liveStats.set([
          { icon: 'restaurant_menu', value: mealsSaved, suffix: '', label: 'Meals rescued' },
          { icon: 'inventory_2', value: foods.length, suffix: '', label: 'Food listings' },
          { icon: 'storefront', value: donors.size, suffix: '', label: 'Donors' },
          { icon: 'eco', value: this.impact.co2Kg, suffix: ' kg', label: 'CO₂ avoided (est.)' }
        ]);
      },
      error: () => {
        this.impact = null;
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.stepTimer);
    clearInterval(this.wordTimer);
  }

  goStep(i: number): void {
    const n = this.steps.length;
    this.activeStep.set(((i % n) + n) % n);
    this.startSteps();
  }

  pauseSteps(paused: boolean): void {
    this.stepsPaused.set(paused);
    if (paused) {
      clearInterval(this.stepTimer);
    } else {
      this.startSteps();
    }
  }

  private startSteps(): void {
    clearInterval(this.stepTimer);
    if (prefersReducedMotion() || this.stepsPaused()) return;
    this.stepTimer = setInterval(() => this.activeStep.update(i => (i + 1) % this.steps.length), STEP_MS);
  }
}
