import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

function UserContextPanel({ userContext, onUserContextChange }) {
  const handleUserIdChange = (e) => {
    const value = e.target.value;
    const userId = parseInt(value, 10);
    onUserContextChange({
      ...userContext,
      userId: isNaN(userId) ? 1 : userId,
    });
  };

  const handleIsAdminChange = (e) => {
    onUserContextChange({
      ...userContext,
      isAdmin: e.target.checked,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }} dir="rtl">
      {/* <Typography variant="subtitle2" sx={{ mb: 1, color: '#0369a1', fontWeight: 600 }}>
        הקשר משתמש (פיתוח)
      </Typography> */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="מזהה משתמש"
          type="number"
          variant="outlined"
          size="small"
          value={userContext.userId}
          onChange={handleUserIdChange}
          inputProps={{ min: 1 }}
          sx={{ width: 120 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={userContext.isAdmin}
              onChange={handleIsAdminChange}
            />
          }
          label="מנהל מערכת"
        />
      </Box>
    </Paper>
  );
}

export default UserContextPanel;
