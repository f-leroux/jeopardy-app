import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView } from 'react-native';
import questionsData from './data/full/jeopardy_questions.json';

function renderTextWithItalics(text) {
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
        <Text key={index} style={italic ? styles.italic : undefined}>{part}</Text>
      );
    }
  });
  return result;
}

export default function App() {
  const [categoryIndex, setCategoryIndex] = useState(() => Math.floor(Math.random() * questionsData.length));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const category = questionsData[categoryIndex];
  const questionObj = category.questions[questionIndex];

  const nextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % category.questions.length);
    setShowAnswer(false);
  };

  const prevQuestion = () => {
    setQuestionIndex((prev) => (prev - 1 + category.questions.length) % category.questions.length);
    setShowAnswer(false);
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
      <Text style={styles.category}>{category.category.replace(/^"|"$/g, '')}</Text>
      <ScrollView contentContainerStyle={styles.questionContainer} style={styles.questionScroll}>
        <Text style={styles.question}>{renderTextWithItalics(questionObj.q)}</Text>
        {showAnswer && (
          <>
            <View style={styles.separator} />
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
          </>
        )}
      </ScrollView>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={prevQuestion}>
          <Text style={styles.buttonText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setShowAnswer(!showAnswer)}>
          <Text style={styles.buttonText}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={nextQuestion}>
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
  container: { flex: 1, justifyContent: 'flex-start', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  category: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  questionScroll: { flex: 1 },
  questionContainer: { flexGrow: 1, justifyContent: 'center' },
  question: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  answer: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  italic: { fontStyle: 'italic' },
  buttonsRow: { flexDirection: 'row', marginBottom: 20 },
  button: { flex: 1, marginHorizontal: 2, paddingVertical: 15, backgroundColor: '#2196F3', borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  newCategory: { marginTop: 10 },
  newCategoryButton: { paddingVertical: 20 }
});
