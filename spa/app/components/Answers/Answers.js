import {Component} from 'react';
import classNames from 'classnames';
import {debounce, pickBy, isEmpty, sortBy, map} from 'lodash';

import './Answers.scss';

import {WORDS_DELIMITER} from '../../../../words-delimeter';
const ANSWER_LIMIT = 10;

function regEscape(word) {
    return word.replace(/(.)/g, '\\$1');
}

export class Answers extends Component {
    constructor(...args) {
        super(...args);
        this.state = {
            search: '',
            answers: [],
            searchPredicate: '',
            expanded: null
        }

        this.fetcher = debounce(this.fetchAnswers, 500);
    }
    fetchAnswers = async searchWords => {
        const [anchor] = searchWords
            .filter(({length}) => length >= 3);
        let answers = {}
        if (anchor) {
            try {
                const responce = await fetch(`search/${anchor.slice(0, 3)}`);
                if (responce.status === 200) {
                    const body = await responce.json();
                    answers = pickBy(body, (answers, question) => {
                        const lowerQuetion = question.toLowerCase();
                        return searchWords.every(word => lowerQuetion.includes(word));
                    })
                }
            } catch (e) {
            }
        }
        answers = sortBy(
            map(answers, (answers, question) => ({answers, question})),
            'question'
        );
        this.setState({answers: answers.slice(0, ANSWER_LIMIT), overflow: answers.length > ANSWER_LIMIT});
    } 

    onSearch = (search) => {
        const searchWords = search.toLowerCase()
            .split(WORDS_DELIMITER)
            .filter(Boolean);
        
        const searchPredicate = isEmpty(searchWords)
            ? /(?=\s)(?=\S)/
            : new RegExp(
                searchWords
                    .map(regEscape)
                    .map(word => `(?=${word})|(?<=${word})`)
                    .join('|'),
                'i'
            );
        this.setState({search, searchWords, searchPredicate, expanded: null});
        const {fetcher} = this;
        fetcher(searchWords);
    }
    onSelect = (expanded) => {
        this.setState({expanded});
    }
    render() {
        const {onSearch, onSelect} = this;
        const {
            search,
            answers,
            overflow,
            searchPredicate,
            expanded
        } = this.state;

        return (<div className="test-answers">
            <Search onChange={onSearch} search={search} />
            <QuestionList answers={answers} search={search} searchPredicate={searchPredicate} onSelect={onSelect} expanded={expanded} />
            {overflow && (<div className="overflow">...</div>)}
        </div>)
    }
}


function Search({onChange, search}) {
    return <div className="search">
            <input value={search} onChange={({target:{value}}) => onChange(value)} autoFocus/>
        </div>
}

function  QuestionList({answers, search, searchPredicate, onSelect, expanded}) {
    return <div className="question-list">
        <div className="question-screen">
            <div className="question-set">
                {answers.map((question) => 
                    <Quetion
                        key={question.question}
                        {...question}
                        expanded={expanded === question}
                        onSelect={() => onSelect(question === expanded ? null : question)}
                        searchPredicate={searchPredicate}
                        fade={expanded && expanded !== question}
                    />
                )}
            </div>
        </div>
    </div>
}

function Quetion({question, answers, searchPredicate, expanded, onSelect, fade}) {
    const words = question.split(searchPredicate)
        .map(word => ({word, searched: Boolean(word.match(searchPredicate))}))
        .map(({word, searched}, index) => (
            <span key={word+index} className={classNames('question-word', {'question-word-searched': searched})}>
                {word}
            </span>
        ))
    return <div className={classNames('question', {'question-fade': fade})} onClick={() => onSelect(question) }>
            <div className="question-title">{words}</div>
            {
                expanded && (
                    <ul className="question-answers">
                        {
                            answers.map((answer, index) => <li className="quetion-answer"  key={answer+index}>{answer}</li>)
                        }
                    </ul>
                )
            }
        </div>
}