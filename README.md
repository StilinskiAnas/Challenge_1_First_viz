# Educational Data Analysis Dashboard

An interactive data visualization dashboard built with D3.js for analyzing educational performance metrics. The dashboard supports dynamic data loading from both CSV and Excel files, making it flexible for different data sources.

## Features

- **Interactive Filters**: Filter data by zone, school type, and gender
- **Multiple Visualization Types**: Various chart types for comprehensive data analysis
- **Responsive Design**: Adapts to different screen sizes
- **Real-time Updates**: Visualizations update automatically when filters change

## Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Use the filters to analyze different aspects of the data


## Visualization Types and Design Choices

### 1. School Type Performance (Grouped Bar Chart)
- **Purpose**: Compare score distributions between public and private schools
- **Features**:
  - Grouped bars for different score types
  - Clear color coding for school categories
  - Interactive tooltips with detailed scores
  - Responsive axes and labels

### 2. Zone Performance Analysis (Grouped Bar Chart)
- **Purpose**: Analyze performance patterns across different geographical zones
- **Features**:
  - Consistent layout with school type chart
  - Zone-wise score comparison
  - Interactive elements for detailed data
  - Clear labeling and legends

### 3. Score Correlations (Heatmap)
- **Purpose**: Visualize relationships between different score types
- **Features**:
  - Color-coded correlation strength
  - Interactive cells with precise values
  - Intuitive color scheme (red-blue diverging)
  - Clear axis labels for score types

### 4. Resource Access Analysis (Stacked Bar Chart)
- **Purpose**: Show resource distribution across zones
- **Features**:
  - Stacked layout for cumulative view
  - Color-coded resource types
  - Interactive segments with details
  - Proportional representation

### Color Scheme Design

#### Performance Metrics
- **Primary Scores**: Deep blue (#2166ac)
- **Secondary Scores**: Medium blue (#67a9cf)
- **Current Scores**: Light blue (#d1e5f0)

#### School Types
- **Public Schools**: Green (#1a9850)
- **Private Schools**: Purple (#7570b3)

#### Resource Types
- **Electricity**: Teal (#66c2a5)
- **Water**: Blue (#3288bd)
- **Computers**: Purple (#5e4fa2)
- **Books**: Green (#66a61e)

#### Correlation Values
- **Positive**: Red (#d73027)
- **Neutral**: White (#f7f7f7)
- **Negative**: Blue (#313695)

## Interactive Features

1. **Filtering System**:
   - Zone selection
   - School type filtering
   - Gender filtering
   - Reset capability

2. **Chart Interactions**:
   - Hover effects for detailed information
   - Click interactions for specific views
   - Smooth transitions between states
   - Responsive to window resizing

## Technical Implementation

### Technologies Used
- D3.js v7 for visualizations
- Vanilla JavaScript for core functionality
- CSS3 for responsive design

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Considerations
- Efficient data processing
- Optimized rendering
- Smooth transitions
- Responsive layout

## Accessibility Features

- **Interactive Elements**: Clear focus states
- **Text**: Readable font sizes and families
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Clear feedback messages

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
