
function initCommands(robotId) {
    return elem = div(`${robotId}-commands`).withClass(`robotCommands ${robotId}`).appendTo(document.body).get();
}

function commandCard(id, status, command) {
    return div(id)
        .withClass(`command ${command.command} ${status}`)
        .attr('data-prio', Math.round(command.prio * 1000));
}

function renderCommands(robot, onSelect, onUnselect) {
    const commandsElem = div(`${robot.id}-commands`).clear().get();

    robot.selectedCommands.forEach((command, index) => {
        const commandElem = commandCard(`${robot.id}-command-selected-${index}`, 'selected', command)
            .appendTo(commandsElem).get();
        commandElem.addEventListener('click', () => onUnselect(robot, command, index));
    });
    robot.lockedCommands.forEach((command, index) => {
        const commandElem = commandCard(`${robot.id}-command-selected-${index}`, 'locked', command)
            .appendTo(commandsElem).get();
    });
    robot.availableCommands.forEach((command, index) => {
        const commandElem = commandCard(`${robot.id}-command-available-${index}`, 'available', command)
            .appendTo(commandsElem).get();
        commandElem.addEventListener('click', () => onSelect(robot, command, index));
    });
}
