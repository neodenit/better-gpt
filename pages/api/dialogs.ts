import type { NextApiRequest, NextApiResponse } from 'next';
import { connect, disconnect } from '../../lib/mongoose';
import Dialog, { IDialog } from '../../lib/models/dialog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    // TODO: validate owner for all methods

    await connect(process.env.MONGODB_URI);
    switch (method) {
        case 'GET': {
            try {
                const dialogs = await Dialog.find({}); // TODO: filter by owner
                res.status(200).json(dialogs);
            } catch (error) {
                console.log(error.message);
                res.status(500).json({ error: 'Error fetching dialogs' });
            }
            break;
        }
        case 'POST': {
            try {
                const dialog = req.body as IDialog;
                const createdDialog = await Dialog.create(dialog);
                res.status(201).json(createdDialog);
            } catch (error) {
                console.log(error.message);
                res.status(500).json({ error: 'Error adding dialog' });
            }
            break;
        }
        case 'PUT': {
            try {
                console.log(req.body);
                const dialog = req.body as IDialog;

                const updatedDialog = await Dialog.findOneAndUpdate(
                    { _id: dialog._id },
                    dialog,
                    { new: true }
                );

                res.status(200).json(updatedDialog);

            } catch (error) {
                console.log(error.message);
                res.status(500).json({ error: 'Error updating dialog' });
            }
            break;
        }
        default: {
            res.status(405).end(`Method ${method} Not Allowed`);
        }
    }

    await disconnect();
}
