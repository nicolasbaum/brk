//! Deterministic Nelder–Mead simplex minimizer.
//!
//! Given an objective and a starting point, returns the parameter vector that
//! (approximately) minimizes it. The initial simplex is built deterministically
//! from `x0` (Matlab `fminsearch` heuristic: each extra vertex perturbs one
//! coordinate by 5%, or by a small fixed amount when that coordinate is zero),
//! so identical inputs always yield bit-identical output. No randomness.

/// Reflection / expansion / contraction / shrink coefficients (standard).
const ALPHA: f64 = 1.0;
const GAMMA: f64 = 2.0;
const RHO: f64 = 0.5;
const SIGMA: f64 = 0.5;

/// Minimize `f` starting from `x0`. Stops when the spread of objective values
/// across the simplex falls below `tol`, or after `max_iter` iterations.
pub(crate) fn nelder_mead<F: Fn(&[f64]) -> f64>(
    f: F,
    x0: &[f64],
    tol: f64,
    max_iter: usize,
) -> Vec<f64> {
    let n = x0.len();
    if n == 0 {
        return Vec::new();
    }

    // Initial simplex: x0 plus one perturbed vertex per dimension.
    let mut simplex: Vec<Vec<f64>> = Vec::with_capacity(n + 1);
    simplex.push(x0.to_vec());
    for i in 0..n {
        let mut v = x0.to_vec();
        v[i] += if v[i] != 0.0 { 0.05 * v[i] } else { 0.00025 };
        simplex.push(v);
    }
    let mut fvals: Vec<f64> = simplex.iter().map(|v| f(v)).collect();

    for _ in 0..max_iter {
        // Order vertices best (0) to worst (n). total_cmp keeps ties deterministic.
        let mut order: Vec<usize> = (0..=n).collect();
        order.sort_by(|&a, &b| fvals[a].total_cmp(&fvals[b]));
        simplex = order.iter().map(|&i| simplex[i].clone()).collect();
        fvals = order.iter().map(|&i| fvals[i]).collect();

        if (fvals[n] - fvals[0]).abs() <= tol {
            break;
        }

        // Centroid of all vertices except the worst.
        let mut centroid = vec![0.0; n];
        for v in simplex.iter().take(n) {
            for (j, cj) in centroid.iter_mut().enumerate() {
                *cj += v[j];
            }
        }
        centroid.iter_mut().for_each(|cj| *cj /= n as f64);

        let worst = simplex[n].clone();
        let reflect = |coeff: f64| -> Vec<f64> {
            (0..n)
                .map(|j| centroid[j] + coeff * (centroid[j] - worst[j]))
                .collect()
        };

        let xr = reflect(ALPHA);
        let fr = f(&xr);

        if fr < fvals[0] {
            // Reflected point is best so far — try expanding further.
            let xe: Vec<f64> = (0..n)
                .map(|j| centroid[j] + GAMMA * (xr[j] - centroid[j]))
                .collect();
            let fe = f(&xe);
            if fe < fr {
                simplex[n] = xe;
                fvals[n] = fe;
            } else {
                simplex[n] = xr;
                fvals[n] = fr;
            }
        } else if fr < fvals[n - 1] {
            // Reflection is a middling improvement — accept it.
            simplex[n] = xr;
            fvals[n] = fr;
        } else {
            // Reflection no better than second-worst — contract.
            let (candidate, fc) = if fr < fvals[n] {
                let xc: Vec<f64> = (0..n)
                    .map(|j| centroid[j] + RHO * (xr[j] - centroid[j]))
                    .collect();
                let fc = f(&xc);
                (xc, fc)
            } else {
                let xc: Vec<f64> = (0..n)
                    .map(|j| centroid[j] - RHO * (centroid[j] - worst[j]))
                    .collect();
                let fc = f(&xc);
                (xc, fc)
            };

            if fc < fvals[n] {
                simplex[n] = candidate;
                fvals[n] = fc;
            } else {
                // Contraction failed — shrink the whole simplex toward the best.
                let best = simplex[0].clone();
                for i in 1..=n {
                    for j in 0..n {
                        simplex[i][j] = best[j] + SIGMA * (simplex[i][j] - best[j]);
                    }
                    fvals[i] = f(&simplex[i]);
                }
            }
        }
    }

    // Return the best vertex.
    let mut best = 0;
    for i in 1..=n {
        if fvals[i] < fvals[best] {
            best = i;
        }
    }
    simplex[best].clone()
}
