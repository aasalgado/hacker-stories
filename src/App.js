import React from 'react';
import axios from 'axios';

const initialStories = [
  {
    title: 'React',
    url: 'https://reactjs.org/',
    author: 'Jordan Walke',
    num_comments: 3,
    points: 4,
    objectID: 0,
  },
  {
    title: 'Redux',
    url: 'https://redux.js.org/',
    author: 'Dan Abramov, Andrew Clark',
    num_comments: 2,
    points: 5,
    objectID: 1,
  },
];

const getAsyncStories = () => 
  // new Promise((resolve, reject) => setTimeout(reject, 2000)
  new Promise(resolve => setTimeout(() => resolve({ data: { stories: initialStories} }), 2000 )
);

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
    );

    React.useEffect(() => {
      localStorage.setItem(key, value);
    }, [value, key]);

    return [value, setValue];
};

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT' :
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        // ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(story => action.payload !== story.objectID
          ),
      };
    default:
      throw new Error();
  }
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const App = () => {

  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React');

  const [ url, setUrl ] = React.useState(`${API_ENDPOINT}${searchTerm}`); 

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
    );

  const handleFetchStories = React.useCallback( async() => {
      dispatchStories({ type: 'STORIES_FETCH_INIT' })
      try {
        const result = await axios.get(url);
        dispatchStories({
          type: 'STORIES_FETCH_SUCCESS',
          payload: result.data.hits,
        });
      } catch {
        dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
      }
  }, [url]);

  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleRemoveStory = itemId => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: itemId,
    });
  }

  const handleSearchInput = event => setSearchTerm(event.target.value);

  const handleSearchSubmit = () => setUrl(`${API_ENDPOINT}${searchTerm}`);
  
  // const searchedStories = stories.data.filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
      <div>
        <h1>My Hacker Stories</h1>

        <InputWithLabel id="Search" value={searchTerm} isFocused OnInputChange={handleSearchInput}>
         <strong>Search:</strong> 
        </InputWithLabel>

        <button type="button" disabled={!searchTerm} onClick={handleSearchSubmit}>Submit</button>
        <hr />

        {stories.isError && <p>Something went wrong ...</p>}

        {stories.isLoading ? (
          <p>Loading...</p>
        ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory}/> 
        )}                                                                            
      </div>
    );
  }

  const InputWithLabel = ({id, value, OnInputChange, type='text', children, isFocused}) => {
    const inputRef = React.useRef();

    React.useEffect(() => {
      if (isFocused && inputRef.current) {
        inputRef.current.focus();
      }
    });
  return (
      <>
        <label htmlFor={id}>{children} </label>
        <input id={id} type={type} value={value} onChange={OnInputChange} ref={inputRef}/>
      </>
  )};


  const List = ({ list, onRemoveItem}) => list.map(item => <Item key={item.objectID} {...item} onRemoveItem={onRemoveItem}/> );

  const Item = ({ url, title, author, num_comments, points, objectID, onRemoveItem }) => (
    <div>
      <span>
        <a href={url}>{title}</a>
      </span>
      <span>{author}</span>
      <span>{num_comments}</span>
      <span>{points}</span>
      <span>
        <button type="button" onClick={() => onRemoveItem(objectID)}>
          Dismiss
        </button>
      </span>
    </div>
  );

export default App;
