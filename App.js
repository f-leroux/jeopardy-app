import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView } from 'react-native';
import questionsData from './data/full/jeopardy_questions.json';

function renderTextWithItalics(text) {
  // If explicit <i> tags exist, honor them
  if (text.includes('<i>') || text.includes('</i>')) {
    const parts = text.split(/(<i>|<\/i>)/g);
    const result = [];
    let italic = false;
    parts.forEach((part, index) => {
      if (part === '<i>') {
        italic = true;
      } else if (part === '</i>') {
        italic = false;
      } else if (part !== '') {
        result.push(
          <Text key={`seg-${index}`} style={italic ? styles.italic : undefined}>{part}</Text>
        );
      }
    });
    return result;
  }

  // Otherwise, treat text inside double quotes as italic (dataset convention)
  const result = [];
  let italic = false;
  let buffer = '';
  let segIndex = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (buffer !== '') {
        result.push(
          <Text key={`seg-${segIndex++}`} style={italic ? styles.italic : undefined}>{buffer}</Text>
        );
        buffer = '';
      }
      italic = !italic; // toggle italic when encountering a quote
      continue;
    }
    buffer += ch;
  }
  if (buffer !== '') {
    result.push(
      <Text key={`seg-${segIndex++}`} style={italic ? styles.italic : undefined}>{buffer}</Text>
    );
  }
  return result;
}

export default function App() {
  const [categoryIndex, setCategoryIndex] = useState(() => Math.floor(Math.random() * questionsData.length));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const category = questionsData[categoryIndex];
  const questionObj = category.questions[questionIndex];

  const nextQuestion = () => {
    if (questionIndex < category.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const newCategory = () => {
    setCategoryIndex(Math.floor(Math.random() * questionsData.length));
    setQuestionIndex(0);
    setShowAnswer(false);
  };

  const handleAnswerPress = () => {
    if (questionObj.wiki_slug) {
      Linking.openURL(`https://en.wikipedia.org/wiki/${questionObj.wiki_slug}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.categoryContainer}>
        <Text style={styles.category} numberOfLines={3} ellipsizeMode="tail">{category.category.replace(/^\"|\"$/g, '')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.questionContainer} style={styles.questionScroll} contentInsetAdjustmentBehavior="never">
        <Text style={styles.question}>{renderTextWithItalics(questionObj.q)}</Text>
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.answerContainer}
        style={[styles.answerScroll, !showAnswer && styles.hidden]}
        contentInsetAdjustmentBehavior="never"
        pointerEvents={showAnswer ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={handleAnswerPress} disabled={!questionObj.wiki_slug}>
          <Text
            style={[
              styles.answer,
              { color: questionObj.wiki_slug ? 'blue' : 'black' }
            ]}
          >
            {renderTextWithItalics(questionObj.a)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, questionIndex === 0 && styles.disabledButton]}
          onPress={prevQuestion}
          disabled={questionIndex === 0}
        >
          <Text style={styles.buttonText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setShowAnswer(!showAnswer)}>
          <Text style={styles.buttonText}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, questionIndex === category.questions.length - 1 && styles.disabledButton]}
          onPress={nextQuestion}
          disabled={questionIndex === category.questions.length - 1}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.newCategory}>
        <TouchableOpacity style={[styles.button, styles.newCategoryButton]} onPress={newCategory}>
          <Text style={styles.buttonText}>New Category</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: '#f0f0f5'
  },
  categoryContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  category: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 0
  },
  questionScroll: {
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden'
  },
  questionContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  question: { fontSize: 20, textAlign: 'center' },
  separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  answer: { fontSize: 20, textAlign: 'center' },
  italic: { fontStyle: 'italic' },
  answerScroll: {
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden'
  },
  answerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  hidden: { opacity: 0 },
  buttonsRow: { flexDirection: 'row', marginBottom: 10 },
  button: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledButton: { backgroundColor: '#a0a0a0' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  newCategory: { marginTop: 5 },
  newCategoryButton: {
    height: 70,
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
