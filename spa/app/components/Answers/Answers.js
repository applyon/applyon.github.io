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
            expanded: null,
            loading: false,
            noResults: false,
            isPoor: false
        }

        this.fetcher = debounce(this.fetchAnswers, 500);
    }
    fetchAnswers = async (searchWords, search) => {
        const [anchor] = searchWords
            .filter(({length}) => length >= 3);
        let answers = {}
        if (anchor) {
            try {
                this.setState({loading: true});
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
        // await new Promise(resolve => setTimeout(resolve, 3000));
        if (this.state.searchWords !== searchWords) {
            return;
        }
        answers = sortBy(
            map(answers, (answers, question) => ({answers, question})),
            'question'
        );
        const expanded = answers.length === 1
            ? answers[0]
            : null;
        const noResults = !isEmpty(anchor) && isEmpty(answers);
        const isPoor = !isEmpty(search) && isEmpty(anchor);

        this.setState({
            answers: answers.slice(0, ANSWER_LIMIT),
            overflow: answers.length > ANSWER_LIMIT,
            expanded,
            loading: false,
            noResults,
            isPoor
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
        this.setState({search, searchWords, searchPredicate});
        const {fetcher} = this;
        fetcher(searchWords, search);
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
            searchWords,
            loading,
            noResults,
            isPoor
        } = this.state;

        return (<div className="test-answers">
            <Search onChange={onSearch} onClear={onClear} search={search} loading={loading} />
            {isPoor && (<div className="message">⚠️ Необходимо сочетание не менее 3ех символов</div>)}
            {noResults && (<div className="message"> Не найдено результатов</div>)}
            {overflow && (<div className="message">⚠️ Стоит указать более четкие критерии</div>)}
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
        const {onChange, search, loading} = this.props;
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
                <div className="search-tools">
                {
                    <div className={classNames('search-tool loading', {active: loading})}>
                        <div className="loading-indicator" />
                    </div>
                }
                {
                    search.replace(/\s+/g, '') && <div className="search-tool" onClick={onClear}>
                            ❌
                        </div>
                }
                </div>
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