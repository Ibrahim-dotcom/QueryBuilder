import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';

const TableNode = ({ data }) => {
  return (
    <Card sx={{ minWidth: 200, border: '1px solid #ccc', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {data.tableName}
        </Typography>
        <List dense>
          {data.columns.map((col) => (
            <ListItem key={col} disablePadding>
              <Handle
                type="source"
                position="right"
                id={`${data.tableName}-${col}`}
                style={{ background: '#555', marginRight: 5 }}
              />
              <ListItemText primary={col} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TableNode;
