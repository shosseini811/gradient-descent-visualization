// Wait for the DOM to be fully loaded before running our code
document.addEventListener('DOMContentLoaded', function() {
    // Get references to HTML elements
    const canvas = document.getElementById('gradient-canvas');
    const ctx = canvas.getContext('2d');
    const learningRateInput = document.getElementById('learning-rate');
    const learningRateValue = document.getElementById('learning-rate-value');
    const iterationsInput = document.getElementById('iterations');
    const iterationsValue = document.getElementById('iterations-value');
    const startingPointInput = document.getElementById('starting-point');
    const startingPointValue = document.getElementById('starting-point-value');
    const zoomLevelInput = document.getElementById('zoom-level');
    const zoomLevelValue = document.getElementById('zoom-level-value');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentIteration = document.getElementById('current-iteration');
    const currentX = document.getElementById('current-x');
    const currentCost = document.getElementById('current-cost');
    const currentDerivative = document.getElementById('current-derivative');

    // Visualization state variables
    let isRunning = false;
    let animationId = null;
    let iteration = 0;
    let path = []; // Stores {x, y, gradient} for each step *before* the update
    let currentPosition = { x: 0, y: 0 }; // Initialized properly in reset/start
    let zoomLevel = 1.0; // Default zoom level
    let panX = 0; // Horizontal panning offset
    
    // Animation configuration
    const animationSpeed = 1; // Controls animation speed
    const GRADIENT_THRESHOLD = 0.001; // Threshold to consider the gradient effectively zero
    
    // Visual configuration
    const colors = {
        functionCurve: '#6366f1', // Primary color
        path: '#10b981', // Secondary color
        currentPoint: '#ef4444', // Danger color
        tangentLine: '#8b5cf6', // Purple
        directionArrow: '#ef4444', // Danger color
        gridLines: 'rgba(226, 232, 240, 0.6)', // Light gray
        axisLines: 'rgba(100, 116, 139, 0.8)' // Darker gray
    };

    // --- Initialization and Event Listeners ---

    function initializeState() {
        isRunning = false;
        iteration = 0;
        
        // Use the starting point from the slider
        const startingX = parseFloat(startingPointInput.value);
        
        currentPosition = {
            x: startingX,
            y: 0 // y will be calculated based on x
        };
        currentPosition.y = costFunction(currentPosition.x);
        path = []; // Clear the path
        updateInfoPanel(); // Update display with initial values
        drawFunction(); // Draw initial state with animation
    }

    // Event listeners for sliders
    learningRateInput.addEventListener('input', function() {
        learningRateValue.textContent = this.value;
        // Optional: If running, could potentially update LR on the fly, but reset is safer
    });

    iterationsInput.addEventListener('input', function() {
        iterationsValue.textContent = this.value;
    });
    
    startingPointInput.addEventListener('input', function() {
        startingPointValue.textContent = this.value;
        if (!isRunning) {
            // Update the position immediately when not running
            currentPosition.x = parseFloat(this.value);
            currentPosition.y = costFunction(currentPosition.x);
            updateInfoPanel();
            drawFunction();
        }
    });
    
    // Zoom level slider event listener
    zoomLevelInput.addEventListener('input', function() {
        zoomLevel = parseFloat(this.value);
        zoomLevelValue.textContent = zoomLevel.toFixed(1);
        drawFunction(); // Redraw with new zoom level
    });
    
    // Horizontal pan slider event listener
    const panXInput = document.getElementById('pan-x');
    const panXValue = document.getElementById('pan-x-value');
    panXInput.addEventListener('input', function() {
        panX = parseFloat(this.value);
        panXValue.textContent = panX.toFixed(1);
        drawFunction(); // Redraw with new horizontal position
    });
    
    // Zoom in button event listener
    zoomInBtn.addEventListener('click', function() {
        if (zoomLevel < 20.0) {
            // Increase zoom by larger steps at higher zoom levels
            const zoomStep = zoomLevel < 5.0 ? 0.5 : 1.0;
            zoomLevel = Math.min(20.0, zoomLevel + zoomStep);
            zoomLevelInput.value = zoomLevel;
            zoomLevelValue.textContent = zoomLevel.toFixed(1);
            drawFunction();
        }
    });
    
    // Zoom out button event listener
    zoomOutBtn.addEventListener('click', function() {
        if (zoomLevel > 0.5) {
            // Decrease zoom by larger steps at higher zoom levels
            const zoomStep = zoomLevel > 5.0 ? 1.0 : 0.5;
            zoomLevel = Math.max(0.5, zoomLevel - zoomStep);
            zoomLevelInput.value = zoomLevel;
            zoomLevelValue.textContent = zoomLevel.toFixed(1);
            drawFunction();
        }
    });

    startBtn.addEventListener('click', function() {
        if (!isRunning) {
            // If path is empty, it means we are starting fresh or after a reset
            if (path.length === 0) {
                 // Use the starting point from the slider
                 currentPosition = {
                    x: parseFloat(startingPointInput.value),
                    y: 0
                 };
                 currentPosition.y = costFunction(currentPosition.x);
            }
            // Always reset iteration count on start
            iteration = 0;
            isRunning = true;
            
            // Add a visual effect to the start button
            startBtn.classList.add('active');
            setTimeout(() => {
                startBtn.classList.remove('active');
            }, 300);
            
            startGradientDescent();
        }
    });

    resetBtn.addEventListener('click', function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Add a visual effect to the reset button
        resetBtn.classList.add('active');
        setTimeout(() => {
            resetBtn.classList.remove('active');
        }, 300);
        
        initializeState(); // Reset everything
    });

    // --- Core Gradient Descent Logic ---

    // Cost function: f(x) = x⁴ - 4x² + 5
    function costFunction(x) {
        return Math.pow(x, 4) - 4 * Math.pow(x, 2) + 5;
    }

    // Gradient (derivative) of the cost function: f'(x) = 4x³ - 8x
    function gradient(x) {
        return 4 * Math.pow(x, 3) - 8 * x;
    }

    // Perform one step of gradient descent
    function gradientDescentStep() {
        const baseLearningRate = parseFloat(learningRateInput.value);
        const currentXValue = currentPosition.x;
        let grad = gradient(currentXValue);
        
        // Calculate the gradient angle from the derivative
        let angleInRadians = Math.atan(grad);
        let angleInDegrees = angleInRadians * 180 / Math.PI;
        
        // If the angle is negative, add 180 degrees to get the correct orientation
        if (angleInDegrees < 0) {
            angleInDegrees = 180 + angleInDegrees;
        }
        
        // Format to 2 decimal places
        const gradientAngle = angleInDegrees.toFixed(2);
        
        // Verify using numerical approximation with adjacent points
        const deltaX = 0.0001; // Small step for numerical approximation
        const x1 = currentXValue - deltaX;
        const y1 = costFunction(x1);
        const x2 = currentXValue + deltaX;
        const y2 = costFunction(x2);
        
        // Calculate numerical slope and angle
        const numericalSlope = (y2 - y1) / (x2 - x1);
        let numericalRadians = Math.atan(numericalSlope);
        let numericalDegrees = numericalRadians * 180 / Math.PI;
        
        // If the numerical angle is negative, add 180 degrees to get the correct orientation
        if (numericalDegrees < 0) {
            numericalDegrees = 180 + numericalDegrees;
        }
        
        // Format to 2 decimal places
        const numericalAngle = numericalDegrees.toFixed(2);
        
        // Log both angles for verification
        console.log(`Iteration ${iteration}: Position (${currentXValue.toFixed(4)}, ${costFunction(currentXValue).toFixed(4)})`);
        console.log(`  Analytical Angle = ${gradientAngle}° (from derivative)`);
        console.log(`  Numerical Angle = ${numericalAngle}° (from adjacent points)`);

        // Store the position *before* the update, along with the gradient at that point
        path.push({ x: currentXValue, y: costFunction(currentXValue), gradient: grad });
        
        // Gradient clipping to prevent extremely large steps
        // This caps the gradient at a maximum magnitude
        const MAX_GRADIENT = 10;
        if (Math.abs(grad) > MAX_GRADIENT) {
            // Keep the sign but cap the magnitude
            grad = Math.sign(grad) * MAX_GRADIENT;
            console.log(`  Gradient clipped from ${gradient(currentXValue).toFixed(4)} to ${grad.toFixed(4)}`);
        }
        
        // Adaptive learning rate - reduce learning rate when gradient is steep
        let adaptiveLearningRate = baseLearningRate;
        if (Math.abs(grad) > 5) {
            // Gradually reduce learning rate as gradient gets steeper
            adaptiveLearningRate = baseLearningRate / (1 + Math.log10(Math.abs(grad) / 5));
            console.log(`  Learning rate adjusted from ${baseLearningRate.toFixed(4)} to ${adaptiveLearningRate.toFixed(4)}`);
        }

        // Calculate the step size and check if it's too large
        const step = adaptiveLearningRate * grad;
        const MAX_STEP = 1.0; // Maximum allowed step size
        
        let actualStep = step;
        if (Math.abs(step) > MAX_STEP) {
            // Keep the sign but cap the magnitude
            actualStep = Math.sign(step) * MAX_STEP;
            console.log(`  Step size limited from ${step.toFixed(4)} to ${actualStep.toFixed(4)}`);
        }
        
        // Modified Gradient Descent Update Rule with step size limiting:
        currentPosition.x = currentXValue - actualStep;

        // Update the y-value for the new x position
        currentPosition.y = costFunction(currentPosition.x);

        iteration++;

        // Update the information panel *after* the step
        updateInfoPanel();
    }

    // Start the gradient descent animation loop
    function startGradientDescent() {
        const maxIterations = parseInt(iterationsInput.value);

        function animate() {
            // Check termination conditions *before* taking the step
            const currentGrad = gradient(currentPosition.x);
            if (iteration >= maxIterations || !isRunning || Math.abs(currentGrad) < GRADIENT_THRESHOLD || !isFinite(currentPosition.x)) {
                isRunning = false;
                updateInfoPanel(); // Ensure final state is displayed
                drawFunction();    // Ensure final state is drawn
                console.log(`Stopped. Reason: ${iteration >= maxIterations ? 'Max Iterations' : !isRunning ? 'Manually Stopped' : !isFinite(currentPosition.x) ? 'Diverged' : 'Gradient Threshold'}`);
                return; // Stop the animation loop
            }

            // Perform one step
            gradientDescentStep();

            // Redraw the function with the updated position
            drawFunction();

            // Schedule the next animation frame with a delay
            // Use setTimeout to control speed, requestAnimationFrame for smooth rendering
            setTimeout(() => {
                 // Check isRunning again in case Reset was clicked during the timeout
                if (isRunning) {
                    animationId = requestAnimationFrame(animate);
                }
            }, 3000); // Reduced delay for slightly faster animation (adjust as needed)
        }

        // Start the animation loop
        animationId = requestAnimationFrame(animate);
    }

    // --- Information Panel Update ---

    function updateInfoPanel() {
        const currentXValue = currentPosition.x;
        const currentCostValue = costFunction(currentXValue);
        const currentGradientValue = gradient(currentXValue);

        // Update with animation effect
        animateCounterUpdate(currentIteration, iteration);
        animateCounterUpdate(currentX, isFinite(currentXValue) ? currentXValue.toFixed(4) : 'N/A');
        animateCounterUpdate(currentCost, isFinite(currentCostValue) ? currentCostValue.toFixed(4) : 'N/A');
        animateCounterUpdate(currentDerivative, isFinite(currentGradientValue) ? currentGradientValue.toFixed(4) : 'N/A');
        
        // Visual indicator for convergence
        if (Math.abs(currentGradientValue) < GRADIENT_THRESHOLD) {
            currentDerivative.parentElement.classList.add('converged');
        } else {
            currentDerivative.parentElement.classList.remove('converged');
        }
    }
    
    // Helper function to animate counter updates
    function animateCounterUpdate(element, newValue) {
        // Add a subtle highlight effect
        element.classList.add('updating');
        setTimeout(() => {
            element.textContent = newValue;
            setTimeout(() => {
                element.classList.remove('updating');
            }, 300);
        }, 50);
    }

    // --- Canvas Drawing Functions ---

    // Draw an arrow
    function drawArrow(fromX, fromY, toX, toY, color) {
        ctx.save(); // Save context state
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2; // Thinner arrow line

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw the arrowhead
        const headLength = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore(); // Restore context state
    }

    // Draw a tangent line and negative gradient direction arrow
    function drawTangentAndDirection(canvasX, canvasY, derivative, colorTangent, colorDirection) {
        ctx.save();
        // For a tangent line with slope m, use the slope directly to calculate direction
        const extendLength = 40; // Longer tangent line for better visibility
        
        // Use the slope (derivative) to create a direction vector (1, slope)
        // This ensures the line follows the exact slope
        const dx = 1;
        const dy = derivative;
        
        // Normalize the direction vector to ensure consistent length
        const length = Math.sqrt(dx*dx + dy*dy);
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Scale to canvas coordinates (y is inverted in canvas)
        // Canvas y-axis points down, but our mathematical y-axis points up
        const x1 = canvasX - extendLength * dirX;
        const y1 = canvasY - extendLength * dirY; // Negative because canvas y is inverted
        const x2 = canvasX + extendLength * dirX;
        const y2 = canvasY + extendLength * dirY;
        
        // Draw the tangent line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = colorTangent;
        ctx.lineWidth = 2; // Thicker line
        ctx.setLineDash([]); // Solid line for clarity
        ctx.stroke();

        // Draw the negative gradient direction arrow (downhill direction)
        // Calculate the base arrow length
        const baseArrowLength = 25;
        
        // Scale the arrow length based on the magnitude of the derivative, but with limits
        // to prevent extremely large or small arrows
        const derivativeMagnitude = Math.min(Math.abs(derivative), 10); // Cap at 10 to prevent huge arrows
        const scaleFactor = Math.max(0.5, Math.min(2, derivativeMagnitude / 2)); // Between 0.5 and 2
        const arrowLength = baseArrowLength * scaleFactor;
        
        // For gradient descent, the actual direction of movement is:
        // Δx = -learning_rate * gradient
        // This means we move in the negative gradient direction, scaled by the learning rate
        
        // Get the current learning rate from the input element
        const learningRate = parseFloat(learningRateInput.value);
        
        // The update rule in gradient descent is:
        // x_new = x_old - learning_rate * gradient
        // So our direction vector is (-learning_rate * gradient, 0) in function space
        // But we need to convert this to canvas space
        
        // In canvas space, a step in the x direction also changes y based on the function
        // The change in y for a step Δx is approximately Δy = f'(x) * Δx = derivative * Δx
        
        // Create the direction vector that matches the actual gradient descent step
        const stepX = -learningRate * derivative; // This is the actual step size in x
        const stepY = costFunction(currentPosition.x + stepX) - costFunction(currentPosition.x);
        
        // Calculate the angle of the actual gradient descent step
        // This is the angle of the direction we're moving in (the green path)
        const stepAngle = Math.atan2(stepY, stepX);
        
        // Use the exact angle to determine the arrow direction
        // This ensures the arrow points exactly in the direction of the angle we're displaying
        const arrowDirX = Math.cos(stepAngle) * arrowLength;
        const arrowDirY = Math.sin(stepAngle) * arrowLength;
        
        // Only visualize if there's a significant gradient
        if (Math.abs(derivative) > 0.001) {
            // Calculate the end point (where the arrow would have been)
            const endPointX = canvasX + arrowDirX;
            const endPointY = canvasY + arrowDirY;
            
            // Convert the angle from radians to degrees for display
            let angleDegrees = stepAngle * 180 / Math.PI;
            
            // If the angle is negative, add 180 degrees to get the correct orientation
            if (angleDegrees < 0) {
                angleDegrees = 180 + angleDegrees;
            }
            
            // Format to 1 decimal place
            const formattedAngleDegrees = angleDegrees.toFixed(1);
            console.log(`Step Angle: ${formattedAngleDegrees}°`);
            
            // Add label showing just the path angle
            ctx.fillStyle = colorDirection;
            ctx.font = '10px Arial';
            ctx.fillText(`Angle: ${formattedAngleDegrees}°`, canvasX + 25, canvasY - 5);
            
            // Draw an arc to visualize the angle on the plot
            const arcRadius = 20; // Radius of the arc in pixels
            
            // Draw the angle arc
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // Orange, semi-transparent
            ctx.lineWidth = 2;
            
            // Start at 0 degrees (horizontal right)
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX + arcRadius, canvasY);
            
            // Draw arc from 0 to the step angle
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, arcRadius, 0, stepAngle, stepAngle < 0);
            ctx.stroke();
            
            // Draw a small dot at the end of the arc
            ctx.beginPath();
            ctx.fillStyle = 'orange';
            const arcEndX = canvasX + arcRadius * Math.cos(stepAngle);
            const arcEndY = canvasY + arcRadius * Math.sin(stepAngle);
            ctx.arc(arcEndX, arcEndY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // No tangent line visualization
        }
        

        ctx.restore();
    }

    // Draw the main visualization (function, path, current point, etc.)
    function drawFunction() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Coordinate system setup
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.6;
        const baseScaleX = 80; // Base scale for x-axis
        const baseScaleY = 15; // Base scale for y-axis
        
        // Apply zoom level to scales
        const scaleX = baseScaleX * zoomLevel;
        const scaleY = baseScaleY * zoomLevel;

        // Helper to convert function coords to canvas coords
        // Include panX in the x-coordinate conversion to enable horizontal panning
        const toCanvasX = (x) => centerX + (x - panX) * scaleX;
        const toCanvasY = (y) => centerY - y * scaleY;

        // Draw Grid Lines with improved styling
        ctx.strokeStyle = colors.gridLines;
        ctx.lineWidth = 0.8;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = colors.axisLines;
        
        // Vertical grid lines - adjust range based on pan position
        const leftEdge = panX - Math.floor(centerX / scaleX) - 1;
        const rightEdge = panX + Math.floor(centerX / scaleX) + 1;
        
        for (let x = leftEdge; x <= rightEdge; x++) {
            if (x === 0) continue; // Skip the axis line
            ctx.beginPath();
            ctx.setLineDash([2, 3]); // Dashed lines for grid
            const cx = toCanvasX(x);
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
            
            // Only show labels for key points and integers
            if (Number.isInteger(x)) {
                ctx.fillText(x.toString(), cx + 2, centerY + 15);
            }
        }
        
        // Horizontal grid lines
        for (let y = 1; y * scaleY <= centerY; y++) { // Positive Y
            if (y === 0) continue; // Skip the axis line
            ctx.beginPath();
            const cy = toCanvasY(y);
            ctx.moveTo(0, cy);
            ctx.lineTo(canvas.width, cy);
            ctx.stroke();
            
            // Only show labels for integers
            if (Number.isInteger(y)) {
                ctx.fillText(y.toString(), centerX + 5, cy - 3);
            }
        }
        
        for (let y = 1; y * scaleY <= (canvas.height - centerY); y++) { // Negative Y
            if (y === 0) continue; // Skip the axis line
            ctx.beginPath();
            const cy = toCanvasY(-y);
            ctx.moveTo(0, cy);
            ctx.lineTo(canvas.width, cy);
            ctx.stroke();
            
            // Only show labels for integers
            if (Number.isInteger(y)) {
                ctx.fillText((-y).toString(), centerX + 5, cy - 3);
            }
        }
        ctx.setLineDash([]); // Reset to solid lines

        // Draw Axes with better styling
        ctx.strokeStyle = colors.axisLines;
        ctx.lineWidth = 1.5;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        
        // Y-axis - adjust position based on panning
        ctx.beginPath();
        const yAxisX = toCanvasX(0); // Y-axis should be at x=0 in mathematical coordinates
        ctx.moveTo(yAxisX, 0);
        ctx.lineTo(yAxisX, canvas.height);
        ctx.stroke();
        
        // Add axis labels
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = colors.axisLines;
        ctx.textAlign = 'center';
        ctx.fillText('x', canvas.width - 15, centerY - 10);
        ctx.fillText('y', centerX + 15, 15);
        
        // Mark key points on x-axis
        const keyPoints = [-Math.sqrt(2), 0, Math.sqrt(2)];
        const keyLabels = ['-√2', '0', '√2'];
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        keyPoints.forEach((x, i) => {
            const canvasX = toCanvasX(x);
            // Draw tick mark
            ctx.beginPath();
            ctx.moveTo(canvasX, centerY - 5);
            ctx.lineTo(canvasX, centerY + 5);
            ctx.strokeStyle = colors.axisLines;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Draw label
            ctx.fillText(keyLabels[i], canvasX, centerY + 8);
        });

        // Draw the function curve with gradient styling
        const curveGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        curveGradient.addColorStop(0, '#6366f1'); // Primary color
        curveGradient.addColorStop(0.5, '#818cf8'); // Lighter shade
        curveGradient.addColorStop(1, '#6366f1'); // Back to primary
        
        ctx.beginPath();
        const plotRange = centerX / scaleX + 0.5; // Ensure function is drawn across the canvas
        const step = 0.02; // Smaller step for smoother curve
        let firstPoint = true;
        for (let x = -plotRange; x <= plotRange; x += step) {
            const y = costFunction(x);
            if (firstPoint) {
                ctx.moveTo(toCanvasX(x), toCanvasY(y));
                firstPoint = false;
            } else {
                ctx.lineTo(toCanvasX(x), toCanvasY(y));
            }
        }
        ctx.strokeStyle = curveGradient;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw the path taken by gradient descent with gradient styling
        if (path.length > 0) {
            // Draw the line connecting points in the path
            ctx.beginPath();
            ctx.moveTo(toCanvasX(path[0].x), toCanvasY(path[0].y));
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(toCanvasX(path[i].x), toCanvasY(path[i].y));
            }
            
            // Create gradient for path
            const pathGradient = ctx.createLinearGradient(
                toCanvasX(path[0].x), 
                toCanvasY(path[0].y), 
                toCanvasX(path[path.length-1].x), 
                toCanvasY(path[path.length-1].y)
            );
            pathGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); // Start: lighter
            pathGradient.addColorStop(1, 'rgba(16, 185, 129, 0.9)'); // End: darker
            
            ctx.strokeStyle = pathGradient;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // Draw circles at each point in the path with a color gradient to show progression
            for (let i = 0; i < path.length; i++) {
                // Calculate a color based on position in the path (from blue to green)
                const progress = i / (path.length - 1 || 1); // Avoid division by zero
                
                // Create a color gradient from blue (start) to green (end)
                const r = Math.round(16 + (progress * (16 - 16))); // Stay at 16
                const g = Math.round(82 + (progress * (185 - 82))); // 82 to 185
                const b = Math.round(204 + (progress * (129 - 204))); // 204 to 129
                
                // Draw the point with a white border for better visibility
                ctx.beginPath();
                ctx.arc(toCanvasX(path[i].x), toCanvasY(path[i].y), 5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Add iteration number for every 5th point (optional)
                if (i % 5 === 0 && i > 0) {
                    ctx.font = '10px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.fillText(i, toCanvasX(path[i].x), toCanvasY(path[i].y) - 8);
                }
            }
        }

        // Draw the current position with glow effect
        if (isFinite(currentPosition.x) && isFinite(currentPosition.y)) {
            const currentCanvasX = toCanvasX(currentPosition.x);
            const currentCanvasY = toCanvasY(currentPosition.y);

            // Add glow effect
            ctx.beginPath();
            ctx.arc(currentCanvasX, currentCanvasY, 10, 0, Math.PI * 2);
            const glowGradient = ctx.createRadialGradient(
                currentCanvasX, currentCanvasY, 2,
                currentCanvasX, currentCanvasY, 10
            );
            glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // Draw the point
            ctx.beginPath();
            ctx.arc(currentCanvasX, currentCanvasY, 6, 0, Math.PI * 2);
            ctx.fillStyle = colors.currentPoint;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke(); // Add outline to current point

            // Draw the tangent and direction arrow at the current position
            // Only draw if the algorithm is running or hasn't converged yet
            const currentGrad = gradient(currentPosition.x);
            if (isRunning || Math.abs(currentGrad) >= GRADIENT_THRESHOLD) {
                // Calculate true y-value on the curve
                const currentX = currentPosition.x;
                const trueY = costFunction(currentX);
                
                // Draw tangent line directly using mathematical coordinates
                const tangentLength = 0.1; // Reduced to half length for better visualization
                
                // Calculate the derivative at this point
                const pathSlope = 4 * Math.pow(currentX, 3) - 8 * currentX;
                
                // Calculate two points on the tangent line in mathematical coordinates
                const x1 = currentX - tangentLength;
                const y1 = trueY - pathSlope * tangentLength;
                const x2 = currentX + tangentLength;
                const y2 = trueY + pathSlope * tangentLength;
                
                // Draw the tangent line with improved styling
                ctx.beginPath();
                ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
                ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
                ctx.strokeStyle = colors.tangentLine;
                ctx.lineWidth = 2.5;
                ctx.stroke();
                
                // Add a small marker at the tangent point
                ctx.beginPath();
                ctx.arc(toCanvasX(currentX), toCanvasY(trueY), 3, 0, Math.PI * 2);
                ctx.fillStyle = colors.tangentLine;
                ctx.fill();
                
                // Draw the direction arrow
                drawTangentAndDirection(toCanvasX(currentX), toCanvasY(trueY), pathSlope, 'transparent', colors.directionArrow);
            }
        }

        // Add function formula with better styling
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = colors.functionCurve;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('f(x) = x⁴ - 4x² + 5', 15, 15);
    }

    // --- Initial Setup ---
    initializeState(); // Set initial values and draw
});