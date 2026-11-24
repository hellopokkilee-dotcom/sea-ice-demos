# Sea Ice Demos

Small interactive demos I made while reading "Modeling Sea Ice" by Golden et al. (Notices of the AMS, 2020).
Each page has one slider. Everything runs in the browser, no install needed.

Live page: https://hellopokkilee-dotcom.github.io/sea-ice-demos/

| # | Demo | Model |
|---|------|-------|
| 1 | Bond percolation | Edges of a 30×30 square lattice open with probability p; critical value p_c = 1/2 |
| 2 | The rule of fives | Brine volume fraction from the Frankenstein–Garner relation; sea ice becomes permeable near 5% (about −5 °C at 5 ppt) |
| 3 | The Ising model | 2D Ising model with Metropolis updates; T_c ≈ 2.269 |
| 4 | Melt ponds | Zero-temperature random-field Ising model of Ma, Sudakov, Strong & Golden (2019), next to a height-only version |
| 5 | Ice–albedo feedback | Simple energy balance model with ice–albedo feedback and hysteresis |
| 6 | Floe fragmentation | Random fragmentation of ice floes (a branching process, critical at p = 1/4) |

## How the code is organized

- `N_name.html` — the page for each demo (text, slider, canvas)
- `N_name.js` — the model and the drawing for that demo, in four parts: settings, model, drawing, controls
- `common.js` — small helpers used by every page
- `style.css` — shared layout and colors
- `index.html` / `index.js` — the home page and its preview pictures

## References

- K. M. Golden et al., "Modeling Sea Ice," Notices of the AMS 67(10), 2020.
- Y.-P. Ma, I. Sudakov, C. Strong, K. M. Golden, "Ising model for melt ponds on Arctic sea ice," New J. Phys. 21, 063029 (2019).
- K. M. Golden, S. F. Ackley, V. I. Lytle, "The percolation phase transition in sea ice," Science 282 (1998).
