# LaTeX Compilation Guide

## Prerequisites

To compile the LaTeX document, you need a LaTeX distribution installed:

### Windows
- **MiKTeX**: https://miktex.org/download
- **TeX Live**: https://www.tug.org/texlive/

### macOS
- **MacTeX**: https://www.tug.org/mactex/
- Or use Homebrew: `brew install --cask mactex`

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# Fedora
sudo dnf install texlive-scheme-full
```

## Required LaTeX Packages

The document uses the following packages (most are included in full LaTeX distributions):
- `geometry` - Page margins
- `xcolor` - Colors
- `tcolorbox` - Colored boxes
- `titlesec` - Section formatting
- `fancyhdr` - Headers and footers
- `hyperref` - Hyperlinks
- `enumitem` - List formatting
- `listings` - Code blocks
- `fontawesome5` - Icons (optional)
- `tikz` - Graphics
- `booktabs` - Tables
- `longtable` - Long tables
- `array` - Array utilities
- `multicol` - Multiple columns

If any package is missing, install it:
```bash
# MiKTeX (Windows) - will prompt automatically
# TeX Live
sudo tlmgr install <package-name>
```

## Compilation

### Method 1: Command Line

```bash
# Navigate to the project directory
cd /path/to/cultivation-compass-main

# Compile the document
pdflatex PRODUCT_DOCUMENTATION.tex
pdflatex PRODUCT_DOCUMENTATION.tex  # Run twice for references

# Or use latexmk (recommended)
latexmk -pdf PRODUCT_DOCUMENTATION.tex
```

### Method 2: Using an IDE

#### TeXstudio (Recommended)
1. Download from: https://www.texstudio.org/
2. Open `PRODUCT_DOCUMENTATION.tex`
3. Click "Build & View" (F5)

#### Overleaf (Online)
1. Go to: https://www.overleaf.com/
2. Create a new project
3. Upload `PRODUCT_DOCUMENTATION.tex`
4. Click "Recompile"

#### VS Code
1. Install LaTeX Workshop extension
2. Open `PRODUCT_DOCUMENTATION.tex`
3. Press `Ctrl+Alt+B` (Windows/Linux) or `Cmd+Option+B` (Mac)

## Output

After successful compilation, you'll get:
- `PRODUCT_DOCUMENTATION.pdf` - The final PDF document

## Troubleshooting

### Missing Packages
If you get errors about missing packages:
- **MiKTeX**: Will prompt to install automatically
- **TeX Live**: Run `sudo tlmgr install <package-name>`

### Font Issues
If fontawesome5 is not available, you can:
1. Remove the `\usepackage{fontawesome5}` line
2. Or install it: `sudo tlmgr install fontawesome5`

### Compilation Errors
- Run `pdflatex` twice to resolve cross-references
- Check for syntax errors in the `.tex` file
- Ensure all required packages are installed

## Customization

### Colors
Edit the color definitions in the preamble:
```latex
\definecolor{primaryblue}{RGB}{0,102,204}
\definecolor{secondaryblue}{RGB}{51,153,255}
```

### Fonts
Change the document class or add font packages:
```latex
\usepackage{times}  % Times New Roman
\usepackage{helvet} % Helvetica
```

### Page Layout
Adjust margins:
```latex
\usepackage[margin=1in]{geometry}  % Change 1in to your preference
```

## Quick Start

1. Install LaTeX distribution (MiKTeX, TeX Live, or MacTeX)
2. Open terminal/command prompt
3. Navigate to project directory
4. Run: `pdflatex PRODUCT_DOCUMENTATION.tex`
5. Open the generated PDF

Enjoy your professional-looking product documentation!
