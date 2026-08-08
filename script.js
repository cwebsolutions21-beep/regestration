document.addEventListener('DOMContentLoaded', () => {
    // Paste your Google Apps Script Web App URL inside the quotes below to sync data across all devices:
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq2uzFV3NEVhfbDOM3jtNjy0M5ErGvDPhmgLHR8eMSYtlOb7rxdThbg-hgs-c9o2hoUw/exec";

    // ----------------------------------------------------
    // 1. DYNAMIC CIRCUIT BACKGROUND CANVAS ANIMATOR
    // ----------------------------------------------------
    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Resize handling
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initCircuitBoard();
    });

    const nodes = [];
    const traces = [];
    const pulses = [];
    const ics = [];
    const maxPulses = 20;

    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 1.5 + 1.5;
            this.glowRadius = this.radius * 2.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.connectedTraces = [];
            
            // Randomly assign a component type to 20% of nodes
            const rand = Math.random();
            if (rand < 0.05) {
                this.type = 'resistor';
            } else if (rand < 0.10) {
                this.type = 'capacitor';
            } else if (rand < 0.15) {
                this.type = 'led';
            } else if (rand < 0.20) {
                this.type = 'gnd';
            } else {
                this.type = 'dot';
            }

            // Silkscreen labels
            this.label = '';
            if (this.type === 'resistor') {
                const id = Math.floor(Math.random() * 30) + 1;
                const vals = ['10k', '1k', '220Ω', '4.7k', '100k', '10k', '330Ω'];
                this.label = `R${id} (${vals[Math.floor(Math.random() * vals.length)]})`;
            } else if (this.type === 'capacitor') {
                const id = Math.floor(Math.random() * 20) + 1;
                const vals = ['0.1µF', '10µF', '100nF', '22µF', '10nF'];
                this.label = `C${id} (${vals[Math.floor(Math.random() * vals.length)]})`;
            } else if (this.type === 'led') {
                const id = Math.floor(Math.random() * 12) + 1;
                this.label = `LED${id}`;
            } else if (this.type === 'gnd') {
                this.label = 'GND';
            }
        }

        draw() {
            ctx.save();
            ctx.shadowBlur = 0;
            
            if (this.type === 'dot') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(57, 255, 20, ${this.opacity})`; // Neon Green PCB Nodes
                ctx.shadowColor = 'rgba(57, 255, 20, 0.4)';
                ctx.shadowBlur = this.glowRadius;
                ctx.fill();
            } else {
                // Clear the background traces under the component
                ctx.fillStyle = '#040c08'; // match var(--bg-dark)
                ctx.fillRect(this.x - 24, this.y - 12, 48, 24);
                
                // Outline style
                ctx.strokeStyle = `rgba(229, 193, 88, ${this.opacity + 0.25})`; // Gold/copper component outline
                ctx.lineWidth = 1.2;
                
                if (this.type === 'resistor') {
                    // Resistor symbol: zig-zag
                    ctx.beginPath();
                    ctx.moveTo(this.x - 18, this.y);
                    ctx.lineTo(this.x - 10, this.y);
                    ctx.lineTo(this.x - 8, this.y - 4);
                    ctx.lineTo(this.x - 4, this.y + 4);
                    ctx.lineTo(this.x, this.y - 4);
                    ctx.lineTo(this.x + 4, this.y + 4);
                    ctx.lineTo(this.x + 8, this.y - 4);
                    ctx.lineTo(this.x + 10, this.y);
                    ctx.lineTo(this.x + 18, this.y);
                    ctx.stroke();
                } else if (this.type === 'capacitor') {
                    // Capacitor symbol: parallel plates
                    ctx.beginPath();
                    ctx.moveTo(this.x - 18, this.y);
                    ctx.lineTo(this.x - 3, this.y);
                    ctx.moveTo(this.x - 3, this.y - 7);
                    ctx.lineTo(this.x - 3, this.y + 7);
                    ctx.moveTo(this.x + 3, this.y - 7);
                    ctx.lineTo(this.x + 3, this.y + 7);
                    ctx.moveTo(this.x + 3, this.y);
                    ctx.lineTo(this.x + 18, this.y);
                    ctx.stroke();
                } else if (this.type === 'led') {
                    // LED diode symbol with arrows
                    ctx.beginPath();
                    ctx.moveTo(this.x - 18, this.y);
                    ctx.lineTo(this.x - 5, this.y);
                    ctx.moveTo(this.x - 5, this.y - 6);
                    ctx.lineTo(this.x + 5, this.y);
                    ctx.lineTo(this.x - 5, this.y + 6);
                    ctx.closePath();
                    ctx.moveTo(this.x + 5, this.y - 6);
                    ctx.lineTo(this.x + 5, this.y + 6);
                    ctx.moveTo(this.x + 5, this.y);
                    ctx.lineTo(this.x + 18, this.y);
                    ctx.stroke();
                    
                    // Emit arrows
                    ctx.strokeStyle = `rgba(57, 255, 20, ${this.opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(this.x - 2, this.y - 8);
                    ctx.lineTo(this.x + 2, this.y - 12);
                    ctx.moveTo(this.x + 2, this.y - 8);
                    ctx.lineTo(this.x + 6, this.y - 12);
                    ctx.stroke();
                } else if (this.type === 'gnd') {
                    // Ground symbol
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y - 8);
                    ctx.lineTo(this.x, this.y);
                    ctx.moveTo(this.x - 10, this.y);
                    ctx.lineTo(this.x + 10, this.y);
                    ctx.moveTo(this.x - 6, this.y + 4);
                    ctx.lineTo(this.x + 6, this.y + 4);
                    ctx.moveTo(this.x - 2, this.y + 8);
                    ctx.lineTo(this.x + 2, this.y + 8);
                    ctx.stroke();
                }

                // Draw silkscreen text label next to the component
                ctx.fillStyle = 'rgba(57, 255, 20, 0.22)'; // faint green silkscreen text
                ctx.font = '600 7px Orbitron, monospace';
                ctx.textAlign = 'center';
                if (this.type === 'gnd') {
                    ctx.fillText(this.label, this.x, this.y + 16);
                } else {
                    ctx.fillText(this.label, this.x, this.y - 10);
                }
            }
            
            ctx.restore();
        }
    }

    const CHIP_PINS = {
        'NE555': {
            left: [ {num: 1, name: 'GND'}, {num: 2, name: 'TRIG'}, {num: 3, name: 'OUT'}, {num: 4, name: 'RST'} ],
            right: [ {num: 8, name: 'VCC'}, {num: 7, name: 'DIS'}, {num: 6, name: 'THR'}, {num: 5, name: 'CON'} ]
        },
        'LM741': {
            left: [ {num: 1, name: 'NULL'}, {num: 2, name: 'IN-'}, {num: 3, name: 'IN+'}, {num: 4, name: 'V-'} ],
            right: [ {num: 8, name: 'NC'}, {num: 7, name: 'V+'}, {num: 6, name: 'OUT'}, {num: 5, name: 'OFST'} ]
        },
        '74HC08': {
            left: [ {num: 1, name: '1A'}, {num: 2, name: '1B'}, {num: 3, name: '1Y'}, {num: 4, name: '2A'}, {num: 5, name: '2B'}, {num: 6, name: '2Y'}, {num: 7, name: 'GND'} ],
            right: [ {num: 14, name: 'VCC'}, {num: 13, name: '4B'}, {num: 12, name: '4A'}, {num: 11, name: '4Y'}, {num: 10, name: '3B'}, {num: 9, name: '3A'}, {num: 8, name: '3Y'} ]
        },
        'ATMEGA328P': {
            left: [
                {num: 1, name: 'RST'}, {num: 2, name: 'RXD'}, {num: 3, name: 'TXD'}, {num: 4, name: 'PD2'},
                {num: 5, name: 'PD3'}, {num: 6, name: 'PD4'}, {num: 7, name: 'VCC'}, {num: 8, name: 'GND'},
                {num: 9, name: 'XTAL1'}, {num: 10, name: 'XTAL2'}, {num: 11, name: 'PD5'}, {num: 12, name: 'PD6'},
                {num: 13, name: 'PD7'}, {num: 14, name: 'PB0'}
            ],
            right: [
                {num: 28, name: 'PC5'}, {num: 27, name: 'PC4'}, {num: 26, name: 'PC3'}, {num: 25, name: 'PC2'},
                {num: 24, name: 'PC1'}, {num: 23, name: 'PC0'}, {num: 22, name: 'GND'}, {num: 21, name: 'AREF'},
                {num: 20, name: 'AVCC'}, {num: 19, name: 'PB5'}, {num: 18, name: 'PB4'}, {num: 17, name: 'PB3'},
                {num: 16, name: 'PB2'}, {num: 15, name: 'PB1'}
            ]
        }
    };

    class IC {
        constructor(x, y, pins, name) {
            this.x = x;
            this.y = y;
            this.pins = pins;
            this.name = name;
            this.width = 68; // wider for schematic pin label room
            this.height = (pins / 2) * 14 + 18;
            this.designator = `U${name === 'ATMEGA328P' ? '1' : name === 'NE555' ? '3' : name === 'LM741' ? '4' : '2'}`;
        }

        draw() {
            ctx.save();
            ctx.shadowBlur = 0;

            // Clear space under symbol (schematic masking)
            ctx.fillStyle = '#040c08'; // match var(--bg-dark)
            ctx.fillRect(this.x - this.width/2 - 20, this.y - this.height/2 - 12, this.width + 40, this.height + 24);

            // Draw schematic box outline
            ctx.strokeStyle = 'rgba(229, 193, 88, 0.45)'; // classic CAD yellow/gold outline
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            ctx.stroke();

            // Draw chip identifier inside center of the box
            ctx.fillStyle = 'rgba(236, 253, 245, 0.7)';
            ctx.font = '700 8.5px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.name, this.x, this.y);

            // Draw schematic reference designator above symbol
            ctx.fillStyle = 'rgba(57, 255, 20, 0.35)'; // Faint green silkscreen text
            ctx.font = '700 7.5px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.designator, this.x, this.y - this.height/2 - 6);

            // Draw pins
            const pinSpacing = 14;
            const pinData = CHIP_PINS[this.name];
            
            ctx.strokeStyle = 'rgba(229, 193, 88, 0.4)';
            ctx.lineWidth = 1.0;

            if (pinData) {
                // Left side pins
                pinData.left.forEach((pin, i) => {
                    const pinY = this.y - this.height/2 + 13 + i * pinSpacing;
                    
                    // Draw terminal wire protruding to the left
                    ctx.beginPath();
                    ctx.moveTo(this.x - this.width/2 - 14, pinY);
                    ctx.lineTo(this.x - this.width/2, pinY);
                    ctx.stroke();

                    // Print physical pin number outside the box
                    ctx.fillStyle = 'rgba(229, 193, 88, 0.35)';
                    ctx.font = '5px monospace';
                    ctx.textAlign = 'right';
                    ctx.fillText(pin.num, this.x - this.width/2 - 3, pinY - 3);

                    // Print logical pin name inside the box
                    ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
                    ctx.font = '6px monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(pin.name, this.x - this.width/2 + 4, pinY);
                });

                // Right side pins
                pinData.right.forEach((pin, i) => {
                    const pinY = this.y - this.height/2 + 13 + i * pinSpacing;
                    
                    // Draw terminal wire protruding to the right
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.width/2, pinY);
                    ctx.lineTo(this.x + this.width/2 + 14, pinY);
                    ctx.stroke();

                    // Print physical pin number outside the box
                    ctx.fillStyle = 'rgba(229, 193, 88, 0.35)';
                    ctx.font = '5px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(pin.num, this.x + this.width/2 + 3, pinY - 3);

                    // Print logical pin name inside the box
                    ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
                    ctx.font = '6px monospace';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(pin.name, this.x + this.width/2 - 4, pinY);
                });
            }

            ctx.restore();
        }
    }

    class Trace {
        constructor(startNode, endNode) {
            this.start = startNode;
            this.end = endNode;
            this.opacity = Math.random() * 0.12 + 0.05;
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(this.end.x, this.end.y);
            ctx.strokeStyle = `rgba(229, 193, 88, ${this.opacity})`; // Gold/copper traces
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    class Pulse {
        constructor(trace) {
            this.trace = trace;
            this.progress = 0; // 0 to 1
            this.speed = Math.random() * 0.012 + 0.008;
            this.color = Math.random() > 0.4 ? '#39ff14' : '#00e5ff'; // Green or Blue signal
        }

        update() {
            this.progress += this.speed;
            return this.progress >= 1;
        }

        draw() {
            const start = this.trace.start;
            const end = this.trace.end;

            // Interpolate position
            const x = start.x + (end.x - start.x) * this.progress;
            const y = start.y + (end.y - start.y) * this.progress;

            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    function initCircuitBoard() {
        nodes.length = 0;
        traces.length = 0;
        pulses.length = 0;
        ics.length = 0;

        // Populate IC chips in positions that border the central form container
        if (width > 768) {
            ics.push(new IC(width * 0.15, height * 0.22, 8, 'NE555'));
            ics.push(new IC(width * 0.12, height * 0.70, 14, '74HC08'));
            ics.push(new IC(width * 0.50, height * 0.86, 28, 'ATMEGA328P'));
            ics.push(new IC(width * 0.85, height * 0.15, 14, 'LM741'));
        } else {
            // Mobile safe spots
            ics.push(new IC(width * 0.25, height * 0.12, 8, 'NE555'));
            ics.push(new IC(width * 0.75, height * 0.90, 14, '74HC08'));
        }

        // Generate grid-like nodes
        const spacing = 120;
        const cols = Math.ceil(width / spacing) + 1;
        const rows = Math.ceil(height / spacing) + 1;

        // Create 2D grid of nodes with slight randomness
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const x = c * spacing + (Math.random() - 0.5) * 40;
                const y = r * spacing + (Math.random() - 0.5) * 40;
                
                // Don't place nodes inside IC chip boundaries to prevent overlap
                let overlap = false;
                for (let ic of ics) {
                    if (x > ic.x - ic.width/2 - 25 && x < ic.x + ic.width/2 + 25 &&
                        y > ic.y - ic.height/2 - 25 && y < ic.y + ic.height/2 + 25) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    const node = new Node(x, y);
                    nodes.push(node);
                    grid[r][c] = node;
                } else {
                    grid[r][c] = null;
                }
            }
        }

        // Connect nodes to form traces
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const node = grid[r][c];
                if (!node) continue;

                // Connect to right neighbor
                if (c < cols - 1 && grid[r][c + 1] && Math.random() > 0.35) {
                    const trace = new Trace(node, grid[r][c + 1]);
                    traces.push(trace);
                    node.connectedTraces.push(trace);
                }
                // Connect to down neighbor
                if (r < rows - 1 && grid[r + 1][c] && Math.random() > 0.35) {
                    const trace = new Trace(node, grid[r + 1][c]);
                    traces.push(trace);
                    node.connectedTraces.push(trace);
                }
                // Connect diagonally sometimes for $45 degree routing looks
                if (r < rows - 1 && c < cols - 1 && grid[r + 1][c + 1] && Math.random() > 0.75) {
                    const trace = new Trace(node, grid[r + 1][c + 1]);
                    traces.push(trace);
                    node.connectedTraces.push(trace);
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw static traces, component nodes, and ICs
        traces.forEach(trace => trace.draw());
        nodes.forEach(node => node.draw());
        ics.forEach(ic => ic.draw());

        // Manage active pulses
        if (pulses.length < maxPulses && traces.length > 0 && Math.random() < 0.15) {
            const randomTrace = traces[Math.floor(Math.random() * traces.length)];
            pulses.push(new Pulse(randomTrace));
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
            const pulse = pulses[i];
            const finished = pulse.update();
            if (finished) {
                // If finished, chain a pulse from the end node if trace exists
                const endNode = pulse.trace.end;
                if (endNode && endNode.connectedTraces.length > 0 && Math.random() > 0.3) {
                    const nextTrace = endNode.connectedTraces[Math.floor(Math.random() * endNode.connectedTraces.length)];
                    pulses.push(new Pulse(nextTrace));
                }
                pulses.splice(i, 1);
            } else {
                pulse.draw();
            }
        }

        requestAnimationFrame(animate);
    }

    // Run Canvas
    initCircuitBoard();
    animate();

    // ----------------------------------------------------
    // 2. FORM VALIDATION & HANDLING
    // ----------------------------------------------------
    const form = document.getElementById('registration-form');
    const submitBtn = document.getElementById('submit-button');
    const btnSpinner = document.getElementById('btn-spinner');
    const btnText = document.getElementById('btn-text');

    const fields = {
        name: {
            input: document.getElementById('input-name'),
            group: document.getElementById('group-name'),
            validate: value => value.trim().length >= 2,
            errorMsg: 'Please enter your full name (minimum 2 characters)'
        },
        roll: {
            input: document.getElementById('input-roll'),
            group: document.getElementById('group-roll'),
            validate: value => {
                const trimmed = value.trim();
                // Basic alphanumeric and dashes test (e.g. 23ECE120, 23-ECE-120, 23/ECE/120)
                const rollRegex = /^[a-zA-Z0-9\-/ ]{4,15}$/;
                return rollRegex.test(trimmed);
            },
            errorMsg: 'Enter a valid roll number (4 to 15 characters)'
        },
        year: {
            input: document.getElementById('select-year'),
            group: document.getElementById('group-year'),
            validate: value => value !== '',
            errorMsg: 'Please select your year of study'
        },
        section: {
            input: document.getElementById('select-section'),
            group: document.getElementById('group-section'),
            validate: value => value !== '',
            errorMsg: 'Please select your class section'
        },
        phone: {
            input: document.getElementById('input-phone'),
            group: document.getElementById('group-phone'),
            validate: value => {
                const digits = value.trim().replace(/\D/g, ''); // strip non-digits
                return digits.length === 10;
            },
            errorMsg: 'Please enter a valid 10-digit phone number'
        }
    };

    // Real-time error removal on typing
    Object.keys(fields).forEach(key => {
        const field = fields[key];
        field.input.addEventListener('input', () => {
            if (field.group.classList.contains('has-error')) {
                const isValid = field.validate(field.input.value);
                if (isValid) {
                    field.group.classList.remove('has-error');
                    const errorEl = field.group.querySelector('.error-message');
                    if (errorEl) errorEl.style.display = 'none';
                }
            }
        });

        // Also for change events (select dropdowns)
        field.input.addEventListener('change', () => {
            const isValid = field.validate(field.input.value);
            if (isValid) {
                field.group.classList.remove('has-error');
                const errorEl = field.group.querySelector('.error-message');
                if (errorEl) errorEl.style.display = 'none';
            }
        });
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let hasErrors = false;

        // Perform final check on all fields
        Object.keys(fields).forEach(key => {
            const field = fields[key];
            const val = field.input.value;
            const isValid = field.validate(val);
            
            if (!isValid) {
                field.group.classList.add('has-error');
                const errorEl = field.group.querySelector('.error-message');
                if (errorEl) {
                    errorEl.textContent = field.errorMsg;
                    errorEl.style.display = 'block';
                }
                hasErrors = true;
            } else {
                field.group.classList.remove('has-error');
                const errorEl = field.group.querySelector('.error-message');
                if (errorEl) errorEl.style.display = 'none';
            }
        });

        if (hasErrors) {
            // Find first error group and scroll to it
            const firstError = document.querySelector('.form-group.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Disable button & show scanning status
        submitBtn.disabled = true;
        btnSpinner.style.display = 'inline-block';
        btnText.textContent = 'TRANSMITTING...';

        // Gather Data
        const registrationData = {
            name: fields.name.input.value.trim(),
            roll: fields.roll.input.value.trim().toUpperCase(),
            year: fields.year.input.value,
            section: fields.section.input.value,
            phone: fields.phone.input.value.trim().replace(/\D/g, ''),
            timestamp: new Date().toLocaleString()
        };

        if (GOOGLE_SCRIPT_URL) {
            // Transmit to central Google Sheets database
            fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // allows cross-domain POSTing to Google Web App
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            })
            .then(() => {
                saveRegistration(registrationData); // backup save locally on this device
                showTicket(registrationData);
                form.reset();
                submitBtn.disabled = false;
                btnSpinner.style.display = 'none';
                btnText.textContent = 'Submit';
            })
            .catch(err => {
                console.error("Transmitting error, saving locally:", err);
                saveRegistration(registrationData);
                showTicket(registrationData);
                form.reset();
                submitBtn.disabled = false;
                btnSpinner.style.display = 'none';
                btnText.textContent = 'Submit';
            });
        } else {
            // Local-only simulated transmission delay
            setTimeout(() => {
                saveRegistration(registrationData);
                showTicket(registrationData);
                form.reset();
                submitBtn.disabled = false;
                btnSpinner.style.display = 'none';
                btnText.textContent = 'Submit';
            }, 1200);
        }
    });

    // ----------------------------------------------------
    // 3. PERSISTENCE LAYER (LOCALSTORAGE)
    // ----------------------------------------------------
    function saveRegistration(data) {
        const stored = localStorage.getItem('circuit_clash_registrations');
        let registrations = stored ? JSON.parse(stored) : [];
        
        // Add new participant
        registrations.push(data);
        localStorage.setItem('circuit_clash_registrations', JSON.stringify(registrations));
    }

    // ----------------------------------------------------
    // 4. DIGITAL TICKET STATE (MODAL)
    // ----------------------------------------------------
    const successModal = document.getElementById('success-modal');
    const closeTicketBtn = document.getElementById('close-ticket-btn');

    const ticketName = document.getElementById('ticket-name');
    const ticketRoll = document.getElementById('ticket-roll');
    const ticketYearSec = document.getElementById('ticket-year-sec');
    const ticketPhone = document.getElementById('ticket-phone');

    function showTicket(data) {
        ticketName.textContent = data.name;
        ticketRoll.textContent = data.roll;
        ticketYearSec.textContent = `${data.year} - ${data.section}`;
        ticketPhone.textContent = data.phone;

        successModal.style.display = 'flex';
        // Add small frame delay to trigger css entry animation
        setTimeout(() => {
            successModal.classList.add('active');
        }, 10);
    }

    function closeTicket() {
        successModal.classList.remove('active');
        setTimeout(() => {
            successModal.style.display = 'none';
        }, 400); // match transition speed
    }

    closeTicketBtn.addEventListener('click', closeTicket);
    
    // Close modal if user clicks outside of container
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            closeTicket();
        }
    });

    // ----------------------------------------------------
    // 5. SECURE ADMIN DASHBOARD & CONTROLS
    // ----------------------------------------------------
    const adminPanel = document.getElementById('admin-panel');
    const adminCloseBtn = document.getElementById('admin-close-btn');
    const adminTableBody = document.getElementById('admin-table-body');
    const noRegsMessage = document.getElementById('no-regs-message');
    const adminSearchInput = document.getElementById('admin-search');
    const adminExportBtn = document.getElementById('admin-export-btn');
    const adminEraseBtn = document.getElementById('admin-erase-btn');

    // Secure Gate Modal elements
    const gateModal = document.getElementById('gate-modal');
    const gateTitle = document.getElementById('gate-title');
    const gateSubtitle = document.getElementById('gate-subtitle');
    const gateInput = document.getElementById('gate-input');
    const gateSubmitBtn = document.getElementById('gate-submit-btn');
    const gateCancelBtn = document.getElementById('gate-cancel-btn');
    const gateErrorEl = document.getElementById('gate-error-message');
    const gateInputLabel = document.getElementById('gate-input-label');
    const gateBadge = document.getElementById('gate-badge');

    // Dashboard Access Trigger 1: Double click title
    const titleTrigger = document.getElementById('main-title-trigger');
    titleTrigger.addEventListener('dblclick', checkAdminAccess);

    // Dashboard Access Trigger 2: Secret hotspot bottom-right (5 taps)
    const secretTrigger = document.getElementById('secret-trigger');
    let triggerCount = 0;
    let triggerTimeout;
    
    secretTrigger.addEventListener('click', () => {
        triggerCount++;
        clearTimeout(triggerTimeout);
        
        if (triggerCount >= 5) {
            triggerCount = 0;
            checkAdminAccess();
        } else {
            triggerTimeout = setTimeout(() => {
                triggerCount = 0;
            }, 2000); // Reset tap count after 2s of inactivity
        }
    });

    const FIXED_ACCESS_KEY = "170617";

    function checkAdminAccess() {
        gateInput.value = '';
        gateErrorEl.style.display = 'none';
        gateInput.parentElement.parentElement.classList.remove('has-error');

        gateBadge.textContent = 'SECURE GATEWAY';
        gateTitle.textContent = 'Access Key';
        gateSubtitle.textContent = 'Authentication Required';
        gateInputLabel.textContent = 'Enter Access Key';
        gateSubmitBtn.textContent = 'Verify';

        // Show Gateway Modal
        gateModal.style.display = 'flex';
        setTimeout(() => {
            gateModal.classList.add('active');
            gateInput.focus();
        }, 10);
    }

    function closeGateModal() {
        gateModal.classList.remove('active');
        setTimeout(() => {
            gateModal.style.display = 'none';
        }, 400);
    }

    gateCancelBtn.addEventListener('click', closeGateModal);
    gateModal.addEventListener('click', (e) => {
        if (e.target === gateModal) {
            closeGateModal();
        }
    });

    function submitGateKey() {
        const enteredKey = gateInput.value.trim();

        if (!enteredKey) {
            gateInput.parentElement.parentElement.classList.add('has-error');
            gateErrorEl.textContent = 'Key cannot be empty!';
            gateErrorEl.style.display = 'block';
            return;
        }

        // Verify against hardcoded manager access code
        if (enteredKey === FIXED_ACCESS_KEY) {
            closeGateModal();
            openAdminPanel();
        } else {
            gateInput.parentElement.parentElement.classList.add('has-error');
            gateErrorEl.textContent = 'Invalid Key. Access Denied.';
            gateErrorEl.style.display = 'block';
        }
    }

    gateSubmitBtn.addEventListener('click', submitGateKey);
    gateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitGateKey();
        }
    });

    function openAdminPanel() {
        loadAdminTable();
        adminPanel.style.display = 'flex';
        setTimeout(() => {
            adminPanel.classList.add('active');
        }, 10);
    }

    function closeAdminPanel() {
        adminPanel.classList.remove('active');
        setTimeout(() => {
            adminPanel.style.display = 'none';
        }, 300);
    }

    adminCloseBtn.addEventListener('click', closeAdminPanel);

    let currentRegistrationsList = [];

    function loadAdminTable() {
        if (GOOGLE_SCRIPT_URL) {
            adminTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--gold-copper); font-style:italic; padding: 2rem;">Syncing database from cloud...</td></tr>';
            noRegsMessage.style.display = 'none';

            fetch(GOOGLE_SCRIPT_URL)
                .then(res => res.json())
                .then(registrations => {
                    currentRegistrationsList = registrations;
                    renderTableRows(registrations);
                })
                .catch(err => {
                    console.error("Failed to load from cloud, reading local cache:", err);
                    const stored = localStorage.getItem('circuit_clash_registrations');
                    currentRegistrationsList = stored ? JSON.parse(stored) : [];
                    renderTableRows(currentRegistrationsList);
                });
        } else {
            const stored = localStorage.getItem('circuit_clash_registrations');
            currentRegistrationsList = stored ? JSON.parse(stored) : [];
            renderTableRows(currentRegistrationsList);
        }
    }

    function renderTableRows(registrations) {
        const filterText = adminSearchInput.value.toLowerCase().trim();
        adminTableBody.innerHTML = '';

        const filtered = registrations.filter(r => {
            return r.name.toLowerCase().includes(filterText) || 
                   r.roll.toLowerCase().includes(filterText) ||
                   r.phone.includes(filterText) ||
                   r.year.toLowerCase().includes(filterText) ||
                   r.section.toLowerCase().includes(filterText);
        });

        if (filtered.length === 0) {
            noRegsMessage.style.display = 'block';
            return;
        }

        noRegsMessage.style.display = 'none';

        filtered.forEach((reg, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td style="font-weight: 600;">${escapeHTML(reg.name)}</td>
                <td style="color: var(--neon-blue); font-family: var(--font-cyber); font-size: 0.85rem;">${escapeHTML(reg.roll)}</td>
                <td>${escapeHTML(reg.year)}</td>
                <td>${escapeHTML(reg.section)}</td>
                <td><a href="tel:${reg.phone}" style="color: inherit; text-decoration: none;">${escapeHTML(reg.phone)}</a></td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(reg.timestamp)}</td>
            `;
            adminTableBody.appendChild(row);
        });
    }

    // Search input handler - filter in-memory cached list instantly
    adminSearchInput.addEventListener('input', () => {
        renderTableRows(currentRegistrationsList);
    });

    // Excel Spreadsheet Exporter
    adminExportBtn.addEventListener('click', () => {
        const registrations = currentRegistrationsList;

        if (registrations.length === 0) {
            alert('No registrations available to export!');
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "S.No,Name,Roll Number,Year,Section,Phone Number,Timestamp\n";

        // Rows
        registrations.forEach((reg, index) => {
            const row = [
                index + 1,
                `"${reg.name.replace(/"/g, '""')}"`,
                `"${reg.roll.replace(/"/g, '""')}"`,
                `"${reg.year.replace(/"/g, '""')}"`,
                `"${reg.section.replace(/"/g, '""')}"`,
                `"${reg.phone}"`,
                `"${reg.timestamp}"`
            ].join(",");
            csvContent += row + "\n";
        });

        // Download trigger
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "circuit_clash_registrations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Erase All Data handler
    adminEraseBtn.addEventListener('click', () => {
        if (currentRegistrationsList.length === 0) {
            alert('Roster is already empty!');
            return;
        }

        if (GOOGLE_SCRIPT_URL) {
            const confirmWipe = confirm('⚠️ WARNING: Are you sure you want to delete all registration records from the cloud Google Sheet? This action cannot be undone.');
            if (confirmWipe) {
                adminTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--gold-copper); font-style:italic; padding: 2rem;">Clearing cloud database...</td></tr>';
                fetch(GOOGLE_SCRIPT_URL + "?action=clear", { method: 'POST', mode: 'no-cors' })
                    .then(() => {
                        localStorage.removeItem('circuit_clash_registrations');
                        loadAdminTable();
                        alert('All registrations have been erased from the cloud Google Sheet.');
                    })
                    .catch(err => {
                        console.error("Cloud wipe failed, falling back to local clear:", err);
                        localStorage.removeItem('circuit_clash_registrations');
                        loadAdminTable();
                        alert('Cloud wipe timed out or failed. Local backup registrations cleared.');
                    });
            }
        } else {
            const confirmWipe = confirm('⚠️ WARNING: Are you sure you want to delete all registration records? This action cannot be undone.');
            if (confirmWipe) {
                localStorage.removeItem('circuit_clash_registrations');
                loadAdminTable();
                alert('All registration data has been erased successfully.');
            }
        }
    });

    // Helper to escape HTML characters
    function escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
