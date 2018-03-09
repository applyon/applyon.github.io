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
        const expanded = answers.length === 1
            ? answers[0]
            : null;
        this.setState({
            answers: answers.slice(0, ANSWER_LIMIT),
            overflow: answers.length > ANSWER_LIMIT,
            expanded
        });
    } 

    onSearch = (search = '') => {
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
        this.setState({search, searchWords, searchPredicate, _expanded: null});
        const {fetcher} = this;
        fetcher(searchWords);
    }
    onSelect = (expanded) => {
        this.setState({expanded});
    }
    render() {
        const {onSearch, onSelect, onClear} = this;
        const {
            search,
            answers,
            overflow,
            searchPredicate,
            expanded,
            searchWords
        } = this.state;
        const isPoor = !isEmpty(searchWords) && searchWords.every(({length}) => length < 3);

        return (<div className="test-answers">
            <Search onChange={onSearch} onClear={onClear} search={search} />
            {isPoor && (<div className="message">⚠️ необходимо сочетание не менее 3ех символов</div>)}
            {overflow && (<div className="message">⚠️ стоит указать более четкие критерии</div>)}
            <QuestionList answers={answers} search={search} searchPredicate={searchPredicate} onSelect={onSelect} expanded={expanded} />
        </div>)
    }
}


class Search extends Component{
    onClear = () => {
        const {onChange} = this.props;
        onChange();
        this.searchInput.focus();
    }
    render() {
        const {onChange, search} = this.props;
        const {onClear} = this;
        return <div className="search">
                <input
                    ref={searchInput => this.searchInput = searchInput}
                    value={search}
                    placeholder="Введите ключевые слова вопроса"
                    onChange={
                        ({target:{value}}) => onChange(value)
                    }
                    autoFocus
                />
                {
                    search.replace(/\s+/g, '') && <span className="clear" onClick={onClear}>
                            ❌
                        </span>
                }
            </div>;
    }
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
                            answers.map(
                                (answer, index) => 
                                    <li className="question-answer"  key={answer+index}>
                                        <span className="question-answer-tytle">{answer}</span>
                                    </li>
                                )
                        }
                    </ul>
                )
            }
        </div>
}