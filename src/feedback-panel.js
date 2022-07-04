import { Container, Button } from '@playcanvas/pcui';

class FeedbackPanel extends Container {
    constructor(args = { }) {
        Object.assign(args, {
            id: 'feedbackPane'
        });

        super(args);

        const group = new Container({
            flex: true,
            flexDirection: 'row'
        });

        const githubButton = new Button({
            text: 'GITHUB',
            icon: '\E259',
            flexGrow: 1
        });

        githubButton.on('click', () => {
            window.open('https://github.com/playcanvas/texture-tool');
        });

        group.append(githubButton);
        this.append(group);
    }
}

export {
    FeedbackPanel
}
