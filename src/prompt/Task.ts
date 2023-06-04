import {Prompt, PromptVisibility} from "../types/Prompt";
import moment from "moment";
import {UserChatMessage} from "../langchain/schema/UserChatMessage";
import Mustache from "mustache";
import _ from "lodash";

export class Task {
    public static async getPrompts() : Promise<Prompt[]> {
        let preferedWorkflow = _.get(await logseq.App.getCurrentGraphConfigs(), 'preferred-workflow', 'now');
        let [later, now] = preferedWorkflow.toLowerCase() == "now" ? ["LATER", "NOW"] : ["TODO", "DOING"];
        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm');
        const currentTimeAlt = moment().format('hh:mm A');
        const currentTimePlus2Hours = moment().add(2, 'hours').format('HH:mm');
        const currentTimePlus2HoursAlt = moment().add(2, 'hours').format('hh:mm A');
        const weekdayCurrentDate = moment().format('dddd');
        return [
            {
                name: 'Generate Logseq Tasks',
                isVisibleInCommandPrompt: PromptVisibility.Blocks,
                getPromptMessage: (userInput, invokeState) =>
                    Mustache.render(`Generate Task(s):\n{{selectedBlocksList}}`,{
                        selectedBlocksList: invokeState.selectedBlocks.map(b => `{{embed ((${b.uuid}))}}`).join('\n')}),
                getPromptPrefixMessages: () => [
                    new UserChatMessage(`Actual Current Time:${currentTime}\nActual Current Date:${currentDate}`),
                    new UserChatMessage(`I want you to act like a loseq task generator. You take the input and output one or more logseq tasks. Please do not refer to yourself AND do not forget to add the   (non-breaking space) unicode charecter before the SCHEDULED tag. 
                    Logseq Tasks have the following format:
                    - {${later}|${now}} Task Title
                       SCHEDULED: <[Start Date] [Weekday] [Start Time] [.Repeater]>
                    ____
                    _user_
                    Generate Tasks:
                    Robert wants to meet up with me today but I have plans to study from ${currentTimeAlt} and then go to bowling with Mark at ${currentTimePlus2HoursAlt} pm.
                    _you_
                    - ${now} study
                       SCHEDULED: <${currentDate} ${weekdayCurrentDate} ${currentTime}>
                    - ${later} bowling with Mark
                       SCHEDULED: <${currentDate} ${weekdayCurrentDate} ${currentTimePlus2Hours}>
                    ____
                    _user_
                    Generate Tasks:
                    Please remind me to brush teeth every morning.
                    _you_
                    - ${later} brush teeth
                       SCHEDULED: <${currentDate} ${weekdayCurrentDate} 08:00 .+1d>
                    ____
                    _user_
                    Generate Tasks:
                    I want to brush teeth right now.
                    _you_
                    - ${now} brush teeth
                       SCHEDULED: <${currentDate} ${weekdayCurrentDate} ${currentTime}>
                    ____
            `.replaceAll('                    ', '').trim())
                ],
                group: 'tasks'
            }
        ]
    }
}
