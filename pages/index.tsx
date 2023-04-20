import { useUser } from '@auth0/nextjs-auth0'
import Layout from '../components/layout'
import { useEffect, useState } from 'react'
import { OpenAIService } from '../client-services/open-ai-service'
import ReactMarkdown from 'react-markdown';

type Message = {
  text: string,
  sender: string,
  timestamp: Date,
}

type Dialog = {
  messages: Message[],
  temperature: number,
  model: string,
  owner: string,
}

const Home = () => {
  const { user, isLoading } = useUser()

  const [dialogs, setDialogs] = useState<Dialog[]>([]);

  const temperature = 0;

  useEffect(() => {
    if (!user) return;

    setDialogs([{ messages: [], temperature: 0, model: 'gpt-3.5-turbo', owner: user.email }]);
  }, [user]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, dialog: Dialog) {
    if (event.key === 'Enter' && (event.shiftKey || event.ctrlKey)) {
      event.preventDefault();

      // TODO: send api request

      const newMessage: Message = { text: event.currentTarget.value, sender: 'user', timestamp: new Date() };
      dialog.messages.push(newMessage);
      const botMessage: Message = { text: '', sender: 'assistant', timestamp: new Date() };
      dialog.messages.push(botMessage);

      const gptMessages = dialog.messages.map(m => {
        return { role: m.sender, content: m.text };
      });

      const openAIService = new OpenAIService();
      event.currentTarget.value = '';
      const server = true;

      if (server) {
        openAIService.getCompletionStreamFromServer(gptMessages, (s: string) => {
          botMessage.text += s;

          setDialogs([...dialogs]);
        });
      } else {
        openAIService.getCompletionStream(gptMessages, temperature, (s: string) => {
          botMessage.text += s;

          setDialogs([...dialogs]);
        });
      }
    }
  }

  return (
    <Layout user={user} loading={isLoading}>
      <h1>BetterGPT</h1>

      {isLoading && <p>Loading login info...</p>}

      {!isLoading && !user && (
        <p>
          Please <a href="/api/auth/login">log in</a>
        </p>
      )}

      {user && (
        <>
          <h2>Dialogs:</h2>
          <div className="accordion" id="accordionExample">
            {dialogs.map((dialog, i) => (
              <div className="accordion-item" key={i}>
                <h2 className="accordion-header" id={`heading${i}`}>
                  <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${i}`} aria-expanded="true" aria-controls={`collapse${i}`}>
                    {dialog.messages.length > 0 ? `${dialog.messages[0].sender}: ${dialog.messages[0].text}` : 'New Dialog'}
                  </button>
                </h2>
                <div id={`collapse${i}`} className="accordion-collapse collapse" aria-labelledby={`heading${i}`} data-bs-parent="#accordionExample">
                  <div className="accordion-body">
                    <ul className='list-group'>
                      {dialog.messages.map((message, j) => (
                        <li className='list-group-item' key={j}><div className='row'><div className='col-2 text-uppercase fw-bold'>{message.sender}:</div><div className='col-10'><ReactMarkdown>{message.text}</ReactMarkdown></div></div></li>
                      ))}
                    </ul>
                    <textarea key={`textarea${i}`} id="question" name="question" rows={4} cols={50} onKeyDown={e => handleKeyDown(e, dialog)} className='form-control' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}

// fast/cached SSR page
export default Home
