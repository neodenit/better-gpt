import { useUser } from '@auth0/nextjs-auth0'
import Layout from '../components/layout'
import { useEffect, useState } from 'react'
import { OpenAIService } from '../client-services/open-ai-service'
import ReactMarkdown from 'react-markdown';
import { IDialog, IMessage } from '../lib/models/dialog';

const Home = () => {
  const { user, isLoading } = useUser()

  const [dialogs, setDialogs] = useState<IDialog[]>([]);

  const temperature = 0;

  useEffect(() => {
    const fetchDialogs = async () => {
      if (!user) return;

      const dialogs = await fetch('/api/dialogs').then(r => r.json()) as IDialog[];
      if (dialogs.find(d => d.messages.length === 0)) {
        setDialogs(dialogs);
      } else {
        const newDialog: IDialog = { messages: [], temperature: 0, model: 'gpt-3.5-turbo', owner: user.email };
        const allDialogs = [newDialog, ...dialogs];
        setDialogs(allDialogs);
      }
    };

    fetchDialogs();
  }, [user]);

  async function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>, dialog: IDialog) {
    if (event.key === 'Enter' && (event.shiftKey || event.ctrlKey)) {
      event.preventDefault();

      const postDialog = async (newDialog: IDialog) => {
        const response = await fetch('/api/dialogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newDialog),
        });

        return response.json();
      };

      const putDialog = async (oldDialog: IDialog) => {
        await fetch('/api/dialogs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(oldDialog),
        });
      };

      const newMessage: IMessage = { text: event.currentTarget.value, sender: 'user' };

      dialog.messages.push(newMessage);

      if (dialog._id) {
        await putDialog(dialog);
      } else {
        const newDialog = await postDialog(dialog) as IDialog;
        dialog._id = newDialog._id;
      }

      const botMessage: IMessage = { text: '', sender: 'assistant' };
      dialog.messages.push(botMessage);

      await putDialog(dialog);

      const gptMessages = dialog.messages.map(m => {
        return { role: m.sender, content: m.text };
      });

      const openAIService = new OpenAIService();
      const textareaElement = event.target as HTMLTextAreaElement;
      textareaElement.value = '';
      const server = true;

      if (server) {
        openAIService.getCompletionStreamFromServer(gptMessages, (s: string) => {
          botMessage.text += s;

          setDialogs([...dialogs]);

          putDialog(dialog);
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
