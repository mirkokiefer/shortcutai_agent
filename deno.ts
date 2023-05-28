const host = 'http://localhost:3000';

const response = await fetch(`${host}/launch`);

const { session_id } = await response.json();



