/**
 * Floating-label fields (see the "Floating labels" section of
 * `css/forms.css`).
 *
 * Wrapping a labelled field in `.fw-floating-field` keeps the label inside the
 * field while it is empty and moves it above the field once the field is
 * focused or has content. Focus is handled in CSS; this helper keeps the
 * "has content" state (`.fw-filled`) in sync.
 */
/**
 * Keep every `.fw-floating-field` inside `root` (default: the whole document)
 * in sync with its control.
 *
 * Idempotent: calling it again only (re)attaches the state for fields that
 * appeared since the previous call. Listens to `input`, `change` and `reset`;
 * if the app updates values programmatically it can call this function again
 * or dispatch an `input` event on the control.
 */
export declare const initFloatingLabels: (root?: ParentNode | null) => void;
//# sourceMappingURL=forms.d.ts.map