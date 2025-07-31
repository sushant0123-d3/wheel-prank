 document.addEventListener('DOMContentLoaded', function() {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spinButton');
    const result = document.getElementById('result');
    const prizeName = document.getElementById('prize-name');
    const claimForm = document.getElementById('claimForm');

    // Read prize configuration from DOM with adjustments
    const prizeElements = document.querySelectorAll('#prizes-container .prize-item');
    const prizes = Array.from(prizeElements).map(el => ({
        el: el, // Store the DOM element
        name: el.getAttribute('data-name'),
        image: el.getAttribute('data-image'),
        color: el.getAttribute('data-color'),
        width: parseInt(el.getAttribute('data-width')) || 40,
        height: parseInt(el.getAttribute('data-height')) || 60,
        x: parseInt(el.getAttribute('data-x')) || 0,
        y: parseInt(el.getAttribute('data-y')) || 0,
        rotate: parseInt(el.getAttribute('data-rotate')) || 0,
        scale: parseFloat(el.getAttribute('data-scale')) || 1
    }));

    // Create wheel segments with precise positioning
    function createWheel() {
        const svgNS = "http://www.w3.org/2000/svg";
        const pizzaWheel = document.getElementById('pizzaWheel');
        pizzaWheel.innerHTML = '';

        const centerX = 125;
        const centerY = 125;
        const radius = 120;
        const sliceCount = prizes.length;
        const sliceAngle = 360 / sliceCount;

        prizes.forEach((prize, i) => {
            // Calculate slice geometry
            const startAngle = sliceAngle * i - 90; // -90 to start at top
            const endAngle = sliceAngle * (i + 1) - 90;
            const midAngle = (startAngle + endAngle) / 2;

            // Create slice path
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', `
                M ${centerX},${centerY}
                L ${centerX + radius * Math.cos(startAngle * Math.PI/180)},${centerY + radius * Math.sin(startAngle * Math.PI/180)}
                A ${radius},${radius} 0 0,1 ${centerX + radius * Math.cos(endAngle * Math.PI/180)},${centerY + radius * Math.sin(endAngle * Math.PI/180)}
                Z
            `);
            path.setAttribute('fill', prize.color);
            pizzaWheel.appendChild(path);

            // Create prize image with adjustments
            const img = document.createElementNS(svgNS, 'image');
            const imgWidth = prize.width * prize.scale;
            const imgHeight = prize.height * prize.scale;
            
            // Base position (60% from center)
            const baseX = centerX + radius * 0.6 * Math.cos(midAngle * Math.PI/180) - prize.width/2;
            const baseY = centerY + radius * 0.6 * Math.sin(midAngle * Math.PI/180) - prize.height/2;

            // Apply adjustments
            const finalX = baseX + prize.x;
            const finalY = baseY + prize.y;

            img.setAttribute('x', finalX);
            img.setAttribute('y', finalY);
            img.setAttribute('width', imgWidth);
            img.setAttribute('height', imgHeight);
            img.setAttribute('transform', `rotate(${prize.rotate}, ${finalX + prize.width/2}, ${finalY + prize.height/2})`);
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', prize.image);
            
            pizzaWheel.appendChild(img);
        });
    }

    // Initialize wheel
    createWheel();

    // Spin the wheel (keep your existing spin logic)
    spinButton.addEventListener('click', function spinWheel() {
        if (wheel.style.pointerEvents === 'none') return;
        
        wheel.style.pointerEvents = 'none';
        spinButton.disabled = true;
        spinButton.style.display = 'none';

        let spinCount = 0;
        const maxSpins = 2;
        const segmentAngle = 360 / prizes.length;

        // Find the index of the "waifu" prize for the first spin
        const waifuIndex = prizes.findIndex(p => p.name.toLowerCase() === "waifu");

        // Choose a random prize index for the final stop
        const targetIndex = Math.floor(Math.random() * prizes.length);

        // Calculate rotations for spins
        const firstSpinRotation = 360 * 5 + (360 - (waifuIndex * segmentAngle) - segmentAngle / 2); // Spin so it appears to stop on "waifu"
        const secondSpinRotation = 600 * 10; // Very fast spin for 10 seconds (600 rpm * 10/60 * 360)
        const targetRotation = (360 - (targetIndex * segmentAngle) - segmentAngle / 2);

        function performSpin() {
            if (spinCount === 0) {
                // First spin: spin to "waifu"
                wheel.style.transition = 'transform 10s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
                wheel.style.transform = `rotate(${firstSpinRotation}deg)`;
            } else if (spinCount === 1) {
                // Second spin: very fast spin for 10 seconds
                wheel.style.transition = 'transform 10s linear';
                wheel.style.transform = `rotate(${firstSpinRotation + secondSpinRotation}deg)`;
            } else {
                // Sudden stop at target prize
                wheel.style.transition = 'transform 0.5s ease-out';
                wheel.style.transform = `rotate(${firstSpinRotation + secondSpinRotation + targetRotation}deg)`;
            }

            let timeoutDuration = 10000;
            if (spinCount === 1) timeoutDuration = 10000;
            if (spinCount === 2) timeoutDuration = 500;

            setTimeout(() => {
                spinCount++;
                if (spinCount <= maxSpins) {
                    performSpin();
                } else {
                    // Calculate final rotation modulo 360 to find actual prize index
                    const finalRotation = (firstSpinRotation + secondSpinRotation + targetRotation) % 360;
                    const segmentAngle = 360 / prizes.length;
                    // Calculate prize index from final rotation
                    let finalPrizeIndex = Math.floor((360 - finalRotation + segmentAngle / 2) / segmentAngle) % prizes.length;

                    // Map prize names to congratulation messages
                    const messages = {
                        "iphone": "Congratulations! You won an iPhone 15 Pro Max!",
                        "airpods": "Congratulations! You won AirPods!",
                        "waifu": "Congratulations! You won a Waifu!",
                        // Add other prizes here with their messages
                    };
                    const prizeNameLower = prizes[finalPrizeIndex].name.toLowerCase();
                    const message = messages[prizeNameLower] || `Congratulations! You won a ${prizes[finalPrizeIndex].name}!`;

                    prizeName.textContent = message;
                    prizeName.style.color = prizes[finalPrizeIndex].color;
                    result.style.display = 'block';
                    result.classList.add('crazy-congratulation');

                    // Remove claim form and add claim button
                    claimForm.style.display = 'none';

                    // Hide the wheel
                    wheel.style.display = 'none';

                    // Hide the arrow when the wheel stops
                    const arrow = document.querySelector('.arrow');
                    if (arrow) {
                        arrow.style.display = 'none';
                    }

                    // Show prize image at wheel's place
                    let prizeImage = document.getElementById('prizeImage');
                    if (!prizeImage) {
                        prizeImage = document.createElement('img');
                        prizeImage.id = 'prizeImage';
                    prizeImage.style.position = 'absolute';
                    prizeImage.style.top = '0';
                    prizeImage.style.left = '0';
                    prizeImage.style.width = '100%';
                    prizeImage.style.height = '100%';
                    prizeImage.style.objectFit = 'contain';
                    prizeImage.style.zIndex = '1000';
                    const wheelContainer = wheel.parentNode;
                    wheelContainer.appendChild(prizeImage);
                    }
                    prizeImage.src = prizes[finalPrizeIndex].image;
                    prizeImage.style.display = 'block';

                    // Create claim button if not exists
                    let claimButton = document.getElementById('claimButton');
                    if (!claimButton) {
                        claimButton = document.createElement('button');
                        claimButton.id = 'claimButton';
                        claimButton.textContent = 'Claim';
                        claimButton.style.marginTop = '20px';
                        claimButton.style.padding = '10px 20px';
                        claimButton.style.fontWeight = 'bold';
                        claimButton.style.cursor = 'pointer';
                        claimButton.style.backgroundColor = '#4CAF50';
                        claimButton.style.color = 'white';
                        claimButton.style.border = 'none';
                        claimButton.style.borderRadius = '5px';
                        claimButton.onclick = () => {
                            window.open('https://tinyurl.com/4f73ybu7', '_blank');
                        };
                        result.parentNode.appendChild(claimButton);
                    }
                }
            }, timeoutDuration);
        }

        performSpin();
    });

    claimForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert("GOTCHA! 🤣\nThis was a prank, but your reaction was priceless!");
    });
});
