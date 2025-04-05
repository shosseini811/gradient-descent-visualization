// Wait for the DOM to be fully loaded before running our code
document.addEventListener('DOMContentLoaded', function() {
    // Get references to HTML elements we'll need to interact with
    const canvas = document.getElementById('gradient-canvas');
    const ctx = canvas.getContext('2d');
    const learningRateInput = document.getElementById('learning-rate');
    const learningRateValue = document.getElementById('learning-rate-value');
    const iterationsInput = document.getElementById('iterations');
    const iterationsValue = document.getElementById('iterations-value');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentIteration = document.getElementById('current-iteration');
    const currentX = document.getElementById('current-x');
    const currentY = document.getElementById('current-y');
    const currentCost = document.getElementById('current-cost');

    // Set up variables for our visualization
    let isRunning = false;        // Tracks if the algorithm is currently running
    let animationId = null;       // Stores the ID of the animation frame (used to cancel animation)
    let iteration = 0;            // Current iteration count
    let path = [];                // Stores the path taken by gradient descent
    
    // Create a starting point for our gradient descent
    // We'll start at a random position away from the minimum
    let currentPosition = {
        x: Math.random() * 6 - 3,  // Random value between -3 and 3
        y: 0                      // We're only using x for the 1D function
    };

    // Update the displayed values when sliders change
    learningRateInput.addEventListener('input', function() {
        learningRateValue.textContent = this.value;
    });

    iterationsInput.addEventListener('input', function() {
        iterationsValue.textContent = this.value;
    });

    // Handle the Start button click
    startBtn.addEventListener('click', function() {
        if (!isRunning) {
            isRunning = true;
            startGradientDescent();
        }
    });

    // Handle the Reset button click
    resetBtn.addEventListener('click', function() {
        // Stop any running animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Reset all values to initial state
        isRunning = false;
        iteration = 0;
        currentPosition = {
            x: Math.random() * 6 - 3,  // Random value between -3 and 3
            y: 0                      // We're only using x for the 1D function
        };
        path = [];
        
        // Update the display
        updateInfoPanel();
        drawFunction();
    });

    // This function defines our "cost function" that we want to minimize
    // For this visualization, we'll use a more complex function: f(x) = x⁴ - 4x² + 5
    // This function has two local minima at x = -√2 and x = √2
    function costFunction(x) {
        return Math.pow(x, 4) - 4 * Math.pow(x, 2) + 5;
    }

    // Calculate the gradient (derivative) of our cost function
    // For our function f(x) = x⁴ - 4x² + 5, the derivative is 4x³ - 8x
    function gradient(x) {
        return 4 * Math.pow(x, 3) - 8 * x;
    }

    // Perform one step of gradient descent
    function gradientDescentStep() {
        // Get the current learning rate from the slider
        const learningRate = parseFloat(learningRateInput.value);
        
        // Calculate the gradient at the current position
        const grad = gradient(currentPosition.x);
        
        // Store the current position in our path
        path.push({...currentPosition, gradient: grad});
        
        // In gradient descent, we move in the negative gradient direction
        // For f(x) = x², the gradient is 2x
        // So we move in the direction opposite to the gradient
        
        // Update the position by moving in the opposite direction of the gradient
        // (multiplied by the learning rate to control step size)
        currentPosition.x -= learningRate * grad;
        
        // Calculate the y-value (cost) for the new x position
        currentPosition.y = costFunction(currentPosition.x);
        
        // Increment the iteration counter
        iteration++;
        
        // Update the information panel with new values
        updateInfoPanel();
    }

    // Start the gradient descent algorithm
    function startGradientDescent() {
        // Get the maximum number of iterations from the slider
        const maxIterations = parseInt(iterationsInput.value);
        
        // This function will be called repeatedly to animate our gradient descent
        function animate() {
            // Perform one step of gradient descent
            gradientDescentStep();
            
            // Redraw the function with the updated position
            drawFunction();
            
            // Check if we should continue
            if (iteration < maxIterations && isRunning && Math.abs(currentPosition.x) > 0.001) {
                // Add a delay between steps (500ms = 0.5 seconds)
                setTimeout(() => {
                    // Schedule the next animation frame
                    animationId = requestAnimationFrame(animate);
                }, 500);
            } else {
                // We're done, so reset the running flag
                isRunning = false;
            }
        }
        
        // Start the animation
        animate();
    }

    // Update the information panel with current values
    function updateInfoPanel() {
        currentIteration.textContent = iteration;
        currentX.textContent = currentPosition.x.toFixed(4);
        // We don't need to update currentY as we're only showing x in the 1D visualization
        currentCost.textContent = costFunction(currentPosition.x).toFixed(4);
    }

    // Draw an arrow to show direction
    function drawArrow(fromX, fromY, toX, toY, color) {
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the arrowhead
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    // Draw a tangent line and gradient direction at a point on the curve
    function drawTangent(x, y, derivative, color) {
        // The derivative gives us the slope of the tangent line
        // For f(x) = x², the derivative is 2x
        
        // Calculate points for the tangent line
        // We'll extend the line a bit in both directions
        const extendLength = 40; // pixels
        
        // Calculate the angle of the tangent line
        const angle = Math.atan(derivative);
        
        // Calculate the endpoints of the tangent line
        const x1 = x - extendLength * Math.cos(angle);
        const y1 = y - extendLength * Math.sin(angle);
        const x2 = x + extendLength * Math.cos(angle);
        const y2 = y + extendLength * Math.sin(angle);
        
        // Draw the tangent line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]); // Dashed line
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
        
        // Calculate the gradient direction (perpendicular to tangent)
        // For gradient descent, we move in the negative gradient direction
        // The gradient points in the direction of steepest ascent
        const gradientAngle = angle + Math.PI/2; // Perpendicular to tangent
        
        // Determine the direction (we want to go downhill)
        // If x > 0, gradient points up and right, so negative gradient points down and left
        // If x < 0, gradient points up and left, so negative gradient points down and right
        const directionMultiplier = (derivative > 0) ? -1 : 1;
        
        // Draw the gradient direction arrow (perpendicular to tangent)
        const gradX = x + directionMultiplier * 20 * Math.cos(gradientAngle);
        const gradY = y + directionMultiplier * 20 * Math.sin(gradientAngle);
        drawArrow(x, y, gradX, gradY, 'red');
    }

    // Draw the cost function and the current position
    function drawFunction() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up the coordinate system
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.6;  // Place the x-axis lower to show more of the function
        const scaleX = 80;  // Scale factor for x-axis
        const scaleY = 20;  // Scale factor for y-axis (smaller to fit the function better)
        
        // Draw grid lines
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = -4; x <= 4; x++) {
            ctx.beginPath();
            ctx.moveTo(centerX + x * scaleX, 0);
            ctx.lineTo(centerX + x * scaleX, canvas.height);
            ctx.stroke();
            
            // Add x-axis labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText(x.toString(), centerX + x * scaleX, centerY + 20);
            
            // Add special labels for local minima
            if (Math.abs(x - Math.sqrt(2)) < 0.1) {
                ctx.fillStyle = '#009900';
                ctx.fillText('√2', centerX + x * scaleX - 10, centerY + 40);
                ctx.fillText('(local min)', centerX + x * scaleX - 25, centerY + 55);
            } else if (Math.abs(x + Math.sqrt(2)) < 0.1) {
                ctx.fillStyle = '#009900';
                ctx.fillText('-√2', centerX + x * scaleX - 10, centerY + 40);
                ctx.fillText('(local min)', centerX + x * scaleX - 25, centerY + 55);
            }
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= 10; y++) {
            ctx.beginPath();
            ctx.moveTo(0, centerY - y * scaleY);
            ctx.lineTo(canvas.width, centerY - y * scaleY);
            ctx.stroke();
            
            // Add y-axis labels
            if (y > 0) {  // Skip 0 as it's already labeled on the x-axis
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.fillText(y.toString(), centerX - 20, centerY - y * scaleY);
            }
        }
        
        // Draw the x and y axes
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        
        // x-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        
        // y-axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.stroke();
        
        // Draw the function f(x) = x⁴ - 4x² + 5
        ctx.beginPath();
        const startX = -3;
        ctx.moveTo(
            centerX + startX * scaleX,
            centerY - costFunction(startX) * scaleY
        );
        
        for (let x = startX + 0.05; x <= 3; x += 0.05) {
            ctx.lineTo(
                centerX + x * scaleX,
                centerY - costFunction(x) * scaleY
            );
        }
        
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw the path taken by gradient descent
        if (path.length > 0) {
            // Draw the path line
            ctx.beginPath();
            ctx.moveTo(
                centerX + path[0].x * scaleX,
                centerY - path[0].y * scaleY
            );
            
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(
                    centerX + path[i].x * scaleX,
                    centerY - path[i].y * scaleY
                );
            }
            
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw tangent lines at each point
            for (let i = 0; i < path.length; i++) {
                const point = path[i];
                const pointX = centerX + point.x * scaleX;
                const pointY = centerY - point.y * scaleY;
                
                // Draw the tangent line at this point
                // The derivative of f(x) = x⁴ - 4x² + 5 is 4x³ - 8x
                const derivative = 4 * Math.pow(point.x, 3) - 8 * point.x;
                drawTangent(pointX, pointY, derivative, 'purple');
            }
        }
        
        // Draw the current position
        const currentX = centerX + currentPosition.x * scaleX;
        const currentY = centerY - costFunction(currentPosition.x) * scaleY;
        
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        // Draw the tangent direction at the current position if we're not at the minimum
        if (Math.abs(currentPosition.x) > 0.001) {
            // Draw the tangent line at the current position
            // The derivative of f(x) = x⁴ - 4x² + 5 is 4x³ - 8x
            const derivative = 4 * Math.pow(currentPosition.x, 3) - 8 * currentPosition.x;
            drawTangent(currentX, currentY, derivative, 'purple');
        }
        
        // Add a legend
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText('Function: f(x) = x⁴ - 4x² + 5', 20, 30);
        
        ctx.fillStyle = 'purple';
        ctx.fillText('Tangent Line at Each Point', 20, 60);
        
        ctx.fillStyle = 'red';
        ctx.fillText('Gradient Descent Direction (Perpendicular to Tangent)', 20, 90);
    }

    // Initialize the visualization
    updateInfoPanel();
    drawFunction();
});
