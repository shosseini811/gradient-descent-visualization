# Gradient Descent Visualization

This is an interactive visualization that demonstrates how gradient descent works. Gradient descent is a fundamental optimization algorithm used in machine learning to find the minimum of a function.

## What is Gradient Descent?

Gradient descent is an iterative optimization algorithm used to minimize a function by moving in the direction of steepest descent (the negative of the gradient). It's commonly used in machine learning to find the optimal parameters for a model.

## Features

- Interactive visualization of gradient descent on the function f(x) = x⁴ - 4x² + 5
- Adjustable learning rate, maximum iterations, and starting point
- Zoom functionality (up to 20x magnification) for detailed exploration
- Horizontal panning to explore different regions of the function
- Visual representation of each step in the gradient descent path
- Adaptive learning rate to prevent large jumps
- Real-time information panel showing current position, cost, and gradient

## How to Use This Visualization

1. Open `index.html` in a web browser
2. Adjust the learning rate slider to control the step size
3. Set the maximum number of iterations
4. Choose a starting point using the slider
5. Use the zoom and horizontal position controls to focus on areas of interest
6. Click "Start" to begin the gradient descent algorithm
7. Click "Reset" to start over with the current settings

## Controls Explained

- **Learning Rate**: Controls how large each step is in the gradient descent algorithm
- **Max Iterations**: Sets the maximum number of steps the algorithm will take
- **Starting Point**: Determines where on the x-axis the algorithm begins
- **Zoom Level**: Adjusts the magnification of the visualization (0.5x to 20x)
- **Horizontal Position**: Moves the view left or right to explore different regions
- **Start Button**: Begins the gradient descent algorithm
- **Reset Button**: Resets the algorithm to the starting position

## What You're Seeing

- **The Blue Curve**: Represents the function f(x) = x⁴ - 4x² + 5
- **The Green-to-Blue Gradient Path**: Shows the trajectory of the gradient descent algorithm
- **The Colored Points**: Each point represents a step in the algorithm, with colors changing from blue (start) to green (end)
- **The Red Dot**: Shows the current position
- **The Purple Line**: Represents the tangent line (gradient) at the current position
- **The Information Panel**: Shows the current iteration, position, cost value, and gradient

## Learning Rate Effects

- **Too Small**: The algorithm will take many steps to reach the minimum
- **Too Large**: The algorithm might overshoot and bounce around or even diverge
- **Just Right**: The algorithm will efficiently converge to the minimum

## Files Included

- `index.html` - The main HTML structure with interactive controls
- `styles.css` - CSS styling for a modern, responsive visualization
- `script.js` - JavaScript code that implements gradient descent with adaptive learning rate

## Technical Details

This visualization uses the function f(x) = x⁴ - 4x² + 5, which has local minima at approximately x = ±1.414 (±√2). The gradient of this function is f'(x) = 4x³ - 8x, which is used to determine the direction and magnitude of each step.

The implementation includes:

- Gradient clipping to prevent extremely large steps
- Adaptive learning rate that reduces step size when the gradient is steep
- Maximum step size limiting for stability
- Color-coded visualization of the gradient descent path
- Responsive design that works on different screen sizes

## Running the Visualization

Simply open the `index.html` file in any modern web browser. No additional dependencies or installation is required.
