# Data Visualization Project

This project creates an interactive data visualization using D3.js based on the dataset "base de donne.xlsx".

## Project Structure

- `index.html`: Main HTML file containing the visualization interface
- `styles.css`: CSS styles for the visualization
- `script.js`: D3.js visualization code
- `base de donne.xlsx`: Dataset file

## Setup Instructions

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Upload the Excel file using the file input button
4. The visualization will automatically generate based on the data

## Features

- Dynamic data loading from Excel file
- Responsive design that adapts to different screen sizes
- Interactive visualization with tooltips
- Clean and modern UI

## Design Choices Justification:
- Bar Chart for Academic Performance: Best for comparing categorical data (different score types)
- Pie Chart for Demographics: Effective for showing proportional data (gender distribution)
- Heatmap for Resource Access: Perfect for showing relationships between zones and resources
- Scatter Plot for Score Correlation: Ideal for showing relationships between two continuous variables


## Technologies Used

- D3.js v7
- SheetJS for Excel file parsing
- Modern CSS with Flexbox and Grid
- Vanilla JavaScript

## Development

To modify the visualization:

1. Edit `script.js` to change the visualization logic
2. Modify `styles.css` to update the styling
3. Update `index.html` for structural changes

## Accessibility

The visualization follows accessibility best practices:
- Color-blind friendly color scheme
- Readable font sizes
- Clear contrast ratios
- Responsive design for different devices

## License

MIT License
