import React, { useState } from 'react';
import './CompetenceCalculatorTool.css';
import { Calculator } from 'lucide-react';

const CompetenceCalculatorTool = () => {
  const [total, setTotal] = useState('');
  const [passed, setPassed] = useState('');
  const [result, setResult] = useState(null);

  const calculateCompetence = (e) => {
    e.preventDefault();
    
    const totalNum = parseFloat(total);
    const passedNum = parseFloat(passed);

    if (isNaN(totalNum) || isNaN(passedNum) || totalNum <= 0) {
      alert('Please enter valid numbers. Total must be greater than 0.');
      return;
    }

    if (passedNum > totalNum) {
      alert('Passed number cannot be greater than the total number.');
      return;
    }

    const percentage = (passedNum / totalNum) * 100;
    
    let status = 'good';
    let message = 'Excellent Performance! 🚀';
    
    if (percentage < 40) {
      status = 'poor';
      message = 'Needs Improvement 📚';
    } else if (percentage < 70) {
      status = 'average';
      message = 'Good Effort! 👍';
    }

    setResult({
      percentage: percentage.toFixed(2),
      status,
      message
    });
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <div className="tool-icon-wrapper">
          <Calculator size={32} />
        </div>
        <h2>Competence Calculator</h2>
        <p>Calculate passing percentage instantly</p>
      </div>

      <div className="competence-calculator-content">
        <form onSubmit={calculateCompetence} className="calculator-form">
          <div className="input-group">
            <label htmlFor="total">Total Number of Students</label>
            <input
              id="total"
              type="number"
              placeholder="e.g. 100"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="passed">Number of Passed Students</label>
            <input
              id="passed"
              type="number"
              placeholder="e.g. 75"
              value={passed}
              onChange={(e) => setPassed(e.target.value)}
              min="0"
              required
            />
          </div>

          <button type="submit" className="action-btn">
            Calculate Percentage
          </button>
        </form>

        {result && (
          <div className={`result-card ${result.status}`}>
            <h3>Competence Rate</h3>
            <div className="result-percentage">{result.percentage}%</div>
            <div className="result-message">{result.message}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetenceCalculatorTool;
