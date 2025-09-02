class TicTacToe {
    constructor(playerX, playerO) {
        this.board = Array(9).fill(null);
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = playerX;
        this.winner = null;
        this.turns = 0;
    }

    render() {
        return this.board.map((v, i) => v ? v : (i + 1).toString());
    }

    turn(isO, pos) {
        if (this.board[pos]) return false;

        const symbol = isO ? 'O' : 'X';
        if ((isO && this.currentTurn !== this.playerO) ||
            (!isO && this.currentTurn !== this.playerX)) {
            return false;
        }

        this.board[pos] = symbol;
        this.turns++;

        // check winner
        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (const [a,b,c] of wins) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winner = this.currentTurn;
                break;
            }
        }

        this.currentTurn = isO ? this.playerX : this.playerO;
        return true;
    }
}

module.exports = TicTacToe;
