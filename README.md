# Gradient Descent Visualization

This is an interactive visualization that demonstrates how gradient descent works. Gradient descent is a fundamental optimization algorithm used in machine learning to find the minimum of a function.

## What is Gradient Descent?

Gradient descent is an iterative optimization algorithm used to minimize a function by moving in the direction of steepest descent (the negative of the gradient). It's commonly used in machine learning to find the optimal parameters for a model.

## How to Use This Visualization

1. Open `index.html` in a web browser
2. Adjust the learning rate slider to control the step size
3. Set the maximum number of iterations
4. Click "Start" to begin the visualization
5. Click "Reset" to start over with a new random position

## What You're Seeing

- **The Grid and Contour Lines**: Represent a simple cost function (f(x,y) = x² + y²)
- **The Red Dot**: Shows the current position in parameter space
- **The Blue Line**: Traces the path taken by gradient descent
- **The Information Panel**: Shows the current iteration, position, and cost value

## Learning Rate Effects

- **Too Small**: The algorithm will take many steps to reach the minimum
- **Too Large**: The algorithm might overshoot and bounce around or even diverge
- **Just Right**: The algorithm will efficiently converge to the minimum

## Files Included

- `index.html` - The main HTML structure
- `styles.css` - CSS styling for the visualization
- `script.js` - JavaScript code that implements gradient descent

## Technical Details

This visualization uses a simple quadratic function (f(x,y) = x² + y²) which has a minimum at (0,0). The gradient of this function is [2x, 2y], which points in the direction of steepest increase. Gradient descent moves in the opposite direction of the gradient to find the minimum.
