import { Alert } from '@mui/material';

function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <Alert severity="error" sx={{ my: 2 }}>
      {error}
    </Alert>
  );
}

export default ErrorMessage;
