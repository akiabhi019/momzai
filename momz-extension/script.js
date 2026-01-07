// ============================================
// MOUSE-TRACKING FOG EFFECT (GROK STYLE)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const fogContainer = document.getElementById('fogContainer');
    
    if (fogContainer) {
        let mouseX = 50;
        let mouseY = 50;
        let currentX = 50;
        let currentY = 50;

        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 100;
            mouseY = (e.clientY / window.innerHeight) * 100;
        });

        // Smooth animation loop with Grok-style gradient
        function animateFog() {
            // Smooth interpolation
            currentX += (mouseX - currentX) * 0.03;
            currentY += (mouseY - currentY) * 0.03;

            // Dynamic gradient center based on mouse
            const gradientX = 40 + (currentX * 0.2);
            
            // Apply Grok-style gradient with mouse influence
            fogContainer.style.background = `
                linear-gradient(
                    to right,
                    #000000 0%,
                    #0a1428 ${Math.max(15, gradientX - 20)}%,
                    #1e3a5f ${gradientX}%,
                    #4a7ba7 ${Math.min(70, gradientX + 20)}%,
                    #87ceeb ${Math.min(85, gradientX + 40)}%,
                    #e0f4ff 100%
                )
            `;

            requestAnimationFrame(animateFog);
        }

        animateFog();

        // Add mouse glow effect
        const glowEffect = document.createElement('div');
        glowEffect.style.cssText = `
            position: fixed;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 5;
            background: radial-gradient(
                circle,
                rgba(135, 206, 235, 0.4) 0%,
                rgba(74, 123, 167, 0.2) 30%,
                transparent 70%
            );
            mix-blend-mode: screen;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            opacity: 0;
        `;
        document.body.appendChild(glowEffect);

        document.addEventListener('mousemove', (e) => {
            glowEffect.style.left = e.clientX + 'px';
            glowEffect.style.top = e.clientY + 'px';
            glowEffect.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            glowEffect.style.opacity = '0';
        });
    }

    // ============================================
    // PDF GENERATION (Only on text-to-pdf.html)
    // ============================================
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generatePDF);
    }
});

// ============================================
// PDF GENERATOR FUNCTION
// ============================================
function generatePDF() {
    const textInput = document.getElementById('textInput');
    const errorMessage = document.getElementById('errorMessage');
    const text = textInput.value.trim();

    // Validate input
    if (!text) {
        errorMessage.textContent = 'Please enter some text before generating PDF.';
        errorMessage.classList.add('show');
        return;
    }

    errorMessage.classList.remove('show');

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Process text line by line
    const lines = text.split('\n');

    lines.forEach((line, index) => {
        // Check if new page needed
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }

        // Handle large heading (# Heading)
        if (line.startsWith('# ')) {
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            const content = line.substring(2).trim();
            const splitText = doc.splitTextToSize(content, maxWidth);
            doc.text(splitText, margin, yPosition);
            yPosition += (splitText.length * 28) + 15;
        }
        // Handle medium heading (## Heading)
        else if (line.startsWith('## ')) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            const content = line.substring(3).trim();
            const splitText = doc.splitTextToSize(content, maxWidth);
            doc.text(splitText, margin, yPosition);
            yPosition += (splitText.length * 22) + 12;
        }
        // Handle regular text with formatting
        else {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            // Simple formatting parser
            let processedLine = line;
            const segments = [];
            let currentPos = 0;

            // Bold: **text**
            const boldRegex = /\*\*(.+?)\*\*/g;
            let match;

            while ((match = boldRegex.exec(line)) !== null) {
                // Add text before bold
                if (match.index > currentPos) {
                    segments.push({
                        text: line.substring(currentPos, match.index),
                        style: 'normal'
                    });
                }
                // Add bold text
                segments.push({
                    text: match[1],
                    style: 'bold'
                });
                currentPos = match.index + match[0].length;
            }

            // Add remaining text
            if (currentPos < line.length) {
                segments.push({
                    text: line.substring(currentPos),
                    style: 'normal'
                });
            }

            // If no formatting found, just add the line
            if (segments.length === 0) {
                segments.push({ text: line, style: 'normal' });
            }

            // Render segments
            let xPos = margin;
            segments.forEach(segment => {
                // Handle italic: *text*
                let text = segment.text;
                let isItalic = false;
                
                const italicMatch = text.match(/\*(.+?)\*/);
                if (italicMatch) {
                    text = text.replace(/\*/g, '');
                    isItalic = true;
                }

                if (segment.style === 'bold') {
                    doc.setFont('helvetica', isItalic ? 'bolditalic' : 'bold');
                } else {
                    doc.setFont('helvetica', isItalic ? 'italic' : 'normal');
                }

                const splitText = doc.splitTextToSize(text, maxWidth - (xPos - margin));
                doc.text(splitText, xPos, yPosition);
                
                // Simple approximation for line wrapping
                if (splitText.length > 1) {
                    yPosition += (splitText.length * 16);
                    xPos = margin;
                } else {
                    xPos += doc.getTextWidth(text) + 2;
                }
            });

            if (line.trim() === '') {
                yPosition += 8; // Empty line spacing
            } else {
                yPosition += 20; // Regular line spacing
            }
        }
    });

    // Save PDF
    doc.save('momz-ai.pdf');
}