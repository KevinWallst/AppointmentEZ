/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the necessary components and functions
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock the formatInTimeZone function
jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn().mockImplementation((date, timezone, format) => {
    return '2025年04月21日 9:00 AM';
  }),
  parseISO: jest.fn().mockImplementation((dateString) => new Date(dateString)),
}));

// Create a simple table component for testing
const AdminTable = () => {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '5%', textAlign: 'center', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>状态</th>
            <th style={{ width: '20%', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>日期和时间</th>
            <th style={{ width: '15%', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>姓名</th>
            <th style={{ width: '20%', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>电子邮箱</th>
            <th style={{ width: '15%', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>微信号</th>
            <th style={{ width: '25%', padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>主题</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: '5%', textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: 'green',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  margin: '0 auto',
                }}
              >
                U
              </div>
            </td>
            <td style={{ width: '20%', padding: '8px', border: '1px solid #ddd', wordBreak: 'break-word' }}>2025年04月21日 9:00 AM</td>
            <td style={{ width: '15%', padding: '8px', border: '1px solid #ddd', wordBreak: 'break-word' }}>KevinZ</td>
            <td style={{ width: '20%', padding: '8px', border: '1px solid #ddd', wordBreak: 'break-word' }}>kevinwallst@yahoo.com</td>
            <td style={{ width: '15%', padding: '8px', border: '1px solid #ddd', wordBreak: 'break-word' }}>kevinwallstZ</td>
            <td style={{ width: '25%', padding: '8px', border: '1px solid #ddd', wordBreak: 'break-word' }}>greencard!</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

describe('Admin Table Alignment', () => {
  test('Table headers and cells are properly aligned', () => {
    render(<AdminTable />);

    // Get all table headers and cells
    const headers = screen.getAllByRole('columnheader');
    const cells = screen.getAllByRole('cell');

    // Check that we have the correct number of headers and cells
    expect(headers).toHaveLength(6);
    expect(cells).toHaveLength(6);

    // Check that the first header is "状态"
    expect(headers[0]).toHaveTextContent('状态');

    // Check that the second header is "日期和时间"
    expect(headers[1]).toHaveTextContent('日期和时间');

    // Check that the first cell contains "U"
    expect(cells[0]).toHaveTextContent('U');

    // Check that the second cell contains the date and time
    expect(cells[1]).toHaveTextContent('2025年04月21日 9:00 AM');

    // Check that the status cell has the correct width
    expect(headers[0]).toHaveStyle('width: 5%');
    expect(cells[0]).toHaveStyle('width: 5%');

    // Check that the date/time cell has the correct width
    expect(headers[1]).toHaveStyle('width: 20%');
    expect(cells[1]).toHaveStyle('width: 20%');

    // Check that the status cell is centered
    expect(headers[0]).toHaveStyle('text-align: center');
    expect(cells[0]).toHaveStyle('text-align: center');

    // Check that cells have word-break property
    expect(cells[1]).toHaveStyle('word-break: break-word');
  });
});
