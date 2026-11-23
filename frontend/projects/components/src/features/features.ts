import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One thing Telo Ride does, as the marketing page shows it. The picture is decoration. */
export interface FeatureView {
  image: string;
  /** "Race", "Classes". */
  kicker: string;
  heading: string;
  text: string;
}

/** A grid of features (block features, ADR 0027): one card each, a picture over its words. */
@Component({
  selector: 'ul[wz-features]',
  templateUrl: './features.html',
  styleUrl: './features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'features' },
})
export class Features {
  readonly features = input.required<readonly FeatureView[]>();
}
