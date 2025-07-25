import React, { useMemo } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface GridWrapperProps {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  direction?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

const GridWrapper: React.FC<GridWrapperProps> = ({ 
  container, 
  item, 
  xs,
  sm,
  md,
  lg,
  xl,
  spacing = 2,
  children, 
  sx = {},
  direction = 'row',
  alignItems = 'stretch',
  justifyContent = 'flex-start'
}) => {
  const gridStyles = useMemo((): SxProps<Theme> => {
    let styles: any = { ...sx };

    if (container) {
      styles = {
        ...styles,
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: direction,
        alignItems,
        justifyContent,
        gap: `${spacing * 8}px`,
        width: '100%',
      };
    }

    if (item) {
      // XS (mobile first)
      if (xs) {
        const percentage = (xs / 12) * 100;
        styles.flex = `0 0 calc(${percentage}% - ${spacing * 4}px)`;
        styles.maxWidth = `calc(${percentage}% - ${spacing * 4}px)`;
      }

      // SM and up
      if (sm) {
        const percentage = (sm / 12) * 100;
        styles['@media (min-width: 600px)'] = {
          flex: `0 0 calc(${percentage}% - ${spacing * 4}px)`,
          maxWidth: `calc(${percentage}% - ${spacing * 4}px)`,
        };
      }

      // MD and up
      if (md) {
        const percentage = (md / 12) * 100;
        styles['@media (min-width: 900px)'] = {
          flex: `0 0 calc(${percentage}% - ${spacing * 4}px)`,
          maxWidth: `calc(${percentage}% - ${spacing * 4}px)`,
        };
      }

      // LG and up
      if (lg) {
        const percentage = (lg / 12) * 100;
        styles['@media (min-width: 1200px)'] = {
          flex: `0 0 calc(${percentage}% - ${spacing * 4}px)`,
          maxWidth: `calc(${percentage}% - ${spacing * 4}px)`,
        };
      }

      // XL and up
      if (xl) {
        const percentage = (xl / 12) * 100;
        styles['@media (min-width: 1536px)'] = {
          flex: `0 0 calc(${percentage}% - ${spacing * 4}px)`,
          maxWidth: `calc(${percentage}% - ${spacing * 4}px)`,
        };
      }

      styles = {
        ...styles,
        minWidth: 0, // Prevent flex items from overflowing
        boxSizing: 'border-box',
      };
    }

    return styles;
  }, [container, item, xs, sm, md, lg, xl, spacing, sx, direction, alignItems, justifyContent]);

  return <Box sx={gridStyles}>{children}</Box>;
};

export default GridWrapper;
