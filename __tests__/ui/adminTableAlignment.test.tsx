/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock component for testing table alignment
const AdminTable = () => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '5%', textAlign: 'center' }}>状态</th>
            <th style={{ width: '20%' }}>日期和时间</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: '5%', textAlign: 'center' }}>U</td>
            <td style={{ width: '20%', wordBreak: 'break-word' }}>2025年04月21日 9:00 AM</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

describe('Admin Table Alignment', () => {
  it('renders table with correct column widths', () => {
    render(<AdminTable />);
    
    // Get table headers and cells
    const headers = screen.getAllByRole('columnheader');
    const cells = screen.getAllByRole('cell');
    
    // Check content
    expect(headers[0]).toHaveTextContent('状态');
    expect(headers[0]).toHaveAttribute('style', expect.stringContaining('width: 5%'));
    expect(headers[0]).toHaveAttribute('style', expect.stringContaining('text-align: center'));
    
    expect(headers[1]).toHaveTextContent('日期和时间');
    expect(headers[1]).toHaveAttribute('style', expect.stringContaining('width: 20%'));
    
    expect(cells[0]).toHaveTextContent('U');
    expect(cells[0]).toHaveAttribute('style', expect.stringContaining('width: 5%'));
    expect(cells[0]).toHaveAttribute('style', expect.stringContaining('text-align: center'));
    
    expect(cells[1]).toHaveTextContent('2025年04月21日 9:00 AM');
    expect(cells[1]).toHaveAttribute('style', expect.stringContaining('width: 20%'));
    expect(cells[1]).toHaveAttribute('style', expect.stringContaining('word-break: break-word'));
  });
});
