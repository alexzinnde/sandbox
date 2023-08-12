import {Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Container, Typography} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

function TodoItem() {
  return (
    <Card sx={{maxWidth: 345}}>
      <CardActionArea>
        <CardMedia component='img' height='140' image='/static/images/cards/contemplative-reptile.jpg' alt='green iguana' />
        <CardContent>
          <Typography gutterBottom variant='h5' component='div'>
            <RadioButtonUncheckedIcon />
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size='small' color='primary'>
          Share
        </Button>
      </CardActions>
    </Card>
  );
}

function ListContainer() {
  return (
    <Container maxWidth='sm' style={{border: '2px solid red'}}>
      <TodoItem />
    </Container>
  );
}

export default ListContainer;
