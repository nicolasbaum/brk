//! Monotone rearrangement of quantile predictions (Chernozhukov–Fernández-Val–
//! Galichon, 2010).
//!
//! Independently-fit quantile curves can cross — especially under extrapolation
//! — which would price a higher quantile below a lower one. Sorting the
//! predicted values at each evaluation point restores monotonicity while
//! preserving the set of predicted levels.

/// Sort the predicted values ascending in place, making them non-crossing.
pub fn rearrange(values: &mut [f64]) {
    values.sort_by(f64::total_cmp);
}

/// Whether `values` are non-decreasing (the post-rearrangement invariant).
pub fn is_non_crossing(values: &[f64]) -> bool {
    values.windows(2).all(|w| w[0] <= w[1])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rearrange_sorts_crossed_quantiles() {
        let mut v = [3.0, 1.0, 2.0, 5.0, 4.0];
        rearrange(&mut v);
        assert_eq!(v, [1.0, 2.0, 3.0, 4.0, 5.0]);
        assert!(is_non_crossing(&v));
    }

    #[test]
    fn detects_crossing() {
        assert!(!is_non_crossing(&[1.0, 3.0, 2.0]));
        assert!(is_non_crossing(&[1.0, 2.0, 3.0]));
    }
}
